window.knockoff = (function() {

    var wrap = function(model) {

        if (typeof model != 'object') {
            return model;
        }

        if (model.___knockoffWrapper) {
            return model.___knockoffWrapper;
        }

        var wrapper = ko.utils.extend({}, model);

        Object.defineProperty(wrapper, '___knockoffModel', { value: model });
        Object.defineProperty(model, '___knockoffWrapper', { value: wrapper });

        Object.keys(model).forEach(function(key) {

            var val = model[key], obs;
            if (typeof val == 'function') {

                if (key.substr(0, 3) != 'get') {
                    return;
                }

                var propertyName = key.substr(3),
                    setterName = 'set' + propertyName,
                    setter = model[setterName],
                    camelCasePropertyName = propertyName.substr(0, 1).toLowerCase() +
                        propertyName.substr(1);

                obs = ko.computed({
                    read: val,
                    write: setter,
                    deferEvaluation: true
                });

                wrapper[camelCasePropertyName] = model[key] = obs;
                if (setter) {
                    model[setterName] = obs;
                }

            } else if (Array.isArray(val)) {
                obs = ko.observableArray();
                wrapper[key] = obs;
                var proxyArray = Object.create(obs, {
                    length: {
                        get: function() {
                            return obs().length;
                        }
                    },
                    push: {
                        value: function(item) {
                            obs.push(wrap(item));
                        }
                    },
                    remove: {
                        value: function(item) {
                            obs.remove(item.___knockoffWrapper || item);
                        }
                    }
                });
                val.forEach(proxyArray.push);
                model[key] = proxyArray;

            } else {
                obs = ko.observable(wrap(val));
                wrapper[key] = obs;
                Object.defineProperty(model, key, { get: obs, set: obs });
            }
        });

        return wrapper;
    };

    wrap.unwrap = function(wrapper) {
        return wrapper.___knockoffModel || wrapper;
    };

    return wrap;
})();
