import JudgeStatusIndicator from '../components/JudgeStatusIndicator'

export const Home = (): JSX.Element => ( // fix type
  <>
    <JudgeStatusIndicator status="WJ" /><br />
    <JudgeStatusIndicator status="WJ" detail={{ current: 1, whole: 2}} /><br />
    <JudgeStatusIndicator status="AC" /><br />
    <JudgeStatusIndicator status="WA" /><br />
    <JudgeStatusIndicator status="WA" detail={{ current: 1, whole: 2}} /><br />
    <JudgeStatusIndicator status="TLE" /><br />
    <JudgeStatusIndicator status="TLE" detail={{ current: 1, whole: 2}} /><br />
    <JudgeStatusIndicator status="MLE" /><br />
    <JudgeStatusIndicator status="MLE" detail={{ current: 1, whole: 2}} /><br />
    <JudgeStatusIndicator status="RE" /><br />
    <JudgeStatusIndicator status="RE" detail={{ current: 1, whole: 2}} /><br />
    <JudgeStatusIndicator status="IE" /><br />
    <JudgeStatusIndicator status="IE" detail={{ current: 1, whole: 2}} /><br />
  </>
)

export default Home
