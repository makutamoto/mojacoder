# MojaCoder Repository Instructions

このファイルはリポジトリ全体に適用する。

## Git workflow

- featureブランチは最新のベースコミットから作るが、`origin/master`をupstreamとして引き継がない。次のように明示的に追跡を無効化する。

  ```sh
  git switch --no-track -c codex/<topic> origin/master
  ```

- 誤って`origin/master`をupstreamにした場合は、作業を続ける前に`git branch --unset-upstream`で解除する。
- 初回pushを明示的に依頼されたときだけ、`git push -u origin HEAD`で同名のremoteブランチをupstreamに設定する。
- commitの依頼はpush、PR作成、merge、deployの許可を含まない。それぞれ明示的な依頼が必要。
- dirty worktreeでは、ユーザーの変更をstash、破棄、整形しない。対象パスを列挙して`git add`し、commit前に`git diff --cached`と`git status --short`を確認する。
- 現在の作業と無関係な生成物や変更をcommitへ混ぜない。

## AWS and deployment boundary

- CDKやWAFの実装・設定・commitを依頼されても、AWSアカウントへの接続、STS確認、SSOログイン、`cdk diff`、`cdk deploy`は行わない。
- AWS上の状態確認やdeployは、ユーザーがその操作を明示的に依頼した場合に限る。「有効にする」「今日Blockする」などの設定上の希望を、AWS操作の許可と解釈しない。
- `cdk synth`はローカル検証として扱えるが、AWS認証を要求する処理へ進む場合は停止する。
- deployを明示的に依頼された場合でも、最初にCloudFormation差分を確認し、想定外の置換・削除・asset更新があればdeployせず報告する。
- CDK assetは未commitファイルもhash対象にできる。deploy用のsynthは対象commitから作ったclean worktreeで行い、ユーザーのdirty worktreeを使わない。

## AppSync WAF context

- WAF実装は`mojacoder-backend/lib/appsync-waf.ts`、設定解析は`mojacoder-backend/lib/appsync-waf-config.ts`にある。
- `AWSManagedRulesAmazonIpReputationList`は既知の悪性・偵察IPを対象とする。`appsyncWafIpReputationAction`で`count`と`block`を切り替える。
- rate-based ruleは送信元IP単位で集計される。ユーザー単位ではなく、大学、サークル、大会会場などの共有NAT配下の利用者が合算されることを前提にする。
- フロントエンドの提出画面には、提出状態が`WJ`の間、AppSyncを1秒ごとにpollingする箇所がある。1タブだけでも約300 requests / 5 minutesになり得るため、`300 / 5 minutes / IP`をBlock設定にしてはいけない。
- 現在の初期運用値は`100,000 requests / 5 minutes / IP`のBlockである。これは同一IP配下のおよそ220〜330人が1秒pollingする規模を想定した、誤遮断を避けるための緩い閾値である。
- 閾値を下げる場合は、実トラフィック、共有NATの利用規模、複数タブ、再試行を確認する。可能なら先に1秒pollingをAppSync Subscriptionへ置き換える。
- WAFの`count`と`block`はルール数を変えないためWAF自体の基本料金は同じだが、`count`はリクエストをAppSyncへ通す。コスト削減効果を説明するときはこの違いを明示する。

## Backend verification

- backendテストは次で実行する。

  ```sh
  cd mojacoder-backend
  yarn test --runInBand
  ```

- このリポジトリにはTypeScriptと生成済みJavaScriptが同じ場所に存在し得る。Jestの`moduleFileExtensions`でTypeScriptを先に解決し、CDKのapp commandでは`ts-node --prefer-ts-exts`を維持する。古いJavaScriptを誤って検証・deployしないためである。
- CDKライブラリは1.204系だが、project-local CLIは古い場合がある。schema mismatchが出る場合は、ライブラリと同じCLIでローカルsynthする。

  ```sh
  npx aws-cdk@1.204.0 synth
  ```

- full synthはDockerによるLambda/ECS asset bundlingを行う。WAF単体テストと対象TypeScriptの型チェックを先に実行し、full synthは必要なときだけ行う。
