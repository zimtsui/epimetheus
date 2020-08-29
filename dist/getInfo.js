function getInfo(recaller) {
    const { config } = recaller;
    return {
        name: config.name,
        path: config.path,
        cwd: config.cwd,
        args: config.args,
        nodeArgs: config.nodeArgs,
        recallerStatus: recaller.lifePeriod,
        invokerStatus: recaller.invoker.lifePeriod,
    };
}
export { getInfo as default, getInfo, };
//# sourceMappingURL=getInfo.js.map