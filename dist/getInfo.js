function getInfo(ctrler) {
    const { config } = ctrler;
    return {
        name: config.name,
        path: config.path,
        cwd: config.cwd,
        args: config.args,
        nodeArgs: config.nodeArgs,
        status: ctrler.lifePeriod,
    };
}
export { getInfo as default, getInfo, };
//# sourceMappingURL=getInfo.js.map