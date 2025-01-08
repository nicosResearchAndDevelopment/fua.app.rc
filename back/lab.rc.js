const
    util = require('@fua/core.util');

module.exports = async function RCConnectorLab(
    {
        'agent': agent
    }
) {

    // agent.scheduler.createSchedule('idle', '*/30 * * * * *').on('trigger', () => util.logText('idle'));

    // setTimeout(() => {
    //     const err = new Error('timeout reached');
    //     console.error(err);
    //     process.exit(1);
    // }, 2e3);

}; // RCConnectorLab
