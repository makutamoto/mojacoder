import React from 'react';
import { GetServerSideProps } from 'next';

import SubmissionTable from '../../../components/SubmissionTable';
import { CodetestSubmission, getCodetestSubmissions, submitCodetest } from '../../../lib/backend';

interface Props {
    submissions: CodetestSubmission[],
}

const Submissions: React.FC<Props> = (props) => {
    return (
        <>
            <h2 className="mb-4">すべての提出</h2>
            <SubmissionTable submissions={props.submissions} />
        </>
    )
};
export default Submissions;

export const getServerSideProps: GetServerSideProps<Props> = async () => {
    const submissions = await getCodetestSubmissions();
    return {
        props: {
            submissions
        }
    };
};
