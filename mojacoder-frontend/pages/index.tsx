import JudgeStatusBadge from '../components/JudgeStatusBadge'

export const Home = (): JSX.Element => ( // fix type
  <>
    GitHub ...
    <JudgeStatusBadge status="WJ" />
    <br />
    <JudgeStatusBadge status="WJ" detail={{ current: 1, whole: 2 }} />
    <br />
    <JudgeStatusBadge status="CE" />
    <br />
    <JudgeStatusBadge status="AC" />
    <br />
    <JudgeStatusBadge status="WA" />
    <br />
    <JudgeStatusBadge status="WA" detail={{ current: 1, whole: 2 }} />
    <br />
    <JudgeStatusBadge status="TLE" />
    <br />
    <JudgeStatusBadge status="TLE" detail={{ current: 1, whole: 2 }} />
    <br />
    <JudgeStatusBadge status="MLE" />
    <br />
    <JudgeStatusBadge status="MLE" detail={{ current: 1, whole: 2 }} />
    <br />
    <JudgeStatusBadge status="RE" />
    <br />
    <JudgeStatusBadge status="RE" detail={{ current: 1, whole: 2 }} />
    <br />
    <JudgeStatusBadge status="IE" />
    <br />
    <JudgeStatusBadge status="IE" detail={{ current: 1, whole: 2 }} />
    <br />
  </>
)

export default Home
