import React from 'react'


const ContestPreivew = (contest) => (
    <div className="ContestPreview">
        <div>
            {contest.categoryName}
        </div>
        <div>
            {contest.contestName}
        </div>        
    </div>
);

export default ContestPreivew;