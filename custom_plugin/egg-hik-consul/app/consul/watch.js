class Watch {

    watch(app,services, onChanged) {
        if (services === undefined) {
            throw new Error('service 不能为空');
        }

        if (typeof services === 'string') {
            serviceWatch(app,services);
        } else if (services instanceof Array) {
            services.forEach(service => {
                serviceWatch(app,service);
            });
        }

        function serviceWatch(app,service) {
            const watch = app.consul.watch({method: app.consul.health.checks, options: {
                    wait:'300s',
                    service
                }});
            watch.on('change', data => {
                const result = {
                    name: service,
                    checks:data
                };
                onChanged(null, result);
            });
            watch.on('error', error => {
                onChanged(error, null);
            });
        }
    }
}

module.exports = new Watch();