/*
    KNOCKOFF

    Automatically converts pure JS models into knockoutjs-enabled observable models

    Copyright (C) 2013 Daniel Earwicker <dan@earwicker.com>

    MIT License:

    Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
    associated documentation files (the "Software"), to deal in the Software without restriction,
    including without limitation the rights to use, copy, modify, merge, publish, distribute,
    sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all copies or
    substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
    NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

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
