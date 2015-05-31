var behaviorEditorDataListIndex = 0;
var BehaviorEditor = (function () {
    function BehaviorEditor(tbody, config, projectClient, editConfig) {
        var _this = this;
        this.onResourceReceived = function (resourceId, resource) {
            _this.behaviorPropertiesResource = resource;
            _this._buildBehaviorPropertiesUI();
        };
        this.onResourceEdited = function (resourceId, command) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            if (command === "setScriptBehaviors" || command === "clearScriptBehaviors")
                _this._buildBehaviorPropertiesUI();
        };
        this._onChangeBehaviorName = function (event) { _this.editConfig("setProperty", "behaviorName", event.target.value); };
        // _onChangePropertySet = (event: any) => {}
        this._onChangePropertyValue = function (event) {
            var propertyName = event.target.dataset.behaviorPropertyName;
            var propertyType = event.target.dataset.behaviorPropertyType;
            var propertyValue;
            switch (propertyType) {
                case "boolean": {
                    propertyValue = event.target.checked;
                    break;
                }
                case "number": {
                    propertyValue = parseFloat(event.target.value);
                    break;
                }
                case "string": {
                    propertyValue = event.target.value;
                    break;
                }
                default: {
                    console.error("Unsupported property type: " + propertyType);
                    break;
                }
            }
            _this.editConfig("setBehaviorPropertyValue", propertyName, propertyType, propertyValue, function (err) {
                if (err != null)
                    alert(err);
            });
        };
        this.tbody = tbody;
        this.config = config;
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        this.behaviorNamesDataListElt = document.createElement("datalist");
        this.behaviorNamesDataListElt.id = "behavior-editor-datalist-" + behaviorEditorDataListIndex++;
        this.tbody.appendChild(this.behaviorNamesDataListElt);
        var behaviorNameRow = SupClient.table.appendRow(this.tbody, "Class");
        this.behaviorNameField = SupClient.table.appendTextField(behaviorNameRow.valueCell, this.config.behaviorName);
        this.behaviorNameField.setAttribute("list", this.behaviorNamesDataListElt.id);
        this.behaviorNameField.addEventListener("change", this._onChangeBehaviorName);
        this.behaviorPropertiesHeaderRow = document.createElement("tr");
        var headerTh = document.createElement("th");
        headerTh.textContent = "Customizable properties";
        headerTh.colSpan = 2;
        this.behaviorPropertiesHeaderRow.appendChild(headerTh);
        this.tbody.appendChild(this.behaviorPropertiesHeaderRow);
        this.propertySettingsByName = {};
        this.projectClient.subResource("behaviorProperties", this);
    }
    BehaviorEditor.prototype.destroy = function () { this.projectClient.unsubResource("behaviorProperties", this); };
    BehaviorEditor.prototype._buildBehaviorPropertiesUI = function () {
        // Setup behavior list
        this.behaviorNamesDataListElt.innerHTML = "";
        for (var behaviorName_1 in this.behaviorPropertiesResource.pub.behaviors) {
            var option = document.createElement("option");
            option.value = behaviorName_1;
            option.textContent = behaviorName_1;
            this.behaviorNamesDataListElt.appendChild(option);
        }
        // Clear old property settings
        for (var name_1 in this.propertySettingsByName) {
            var propertySetting = this.propertySettingsByName[name_1];
            propertySetting.row.parentElement.removeChild(propertySetting.row);
        }
        this.propertySettingsByName = {};
        // Setup new property settings
        var behaviorName = this.config.behaviorName;
        var listedProperties = [];
        while (behaviorName != null) {
            var behavior = this.behaviorPropertiesResource.pub.behaviors[behaviorName];
            if (behavior == null)
                break;
            for (var _i = 0, _a = behavior.properties; _i < _a.length; _i++) {
                var property = _a[_i];
                if (listedProperties.indexOf(property.name) !== -1)
                    continue;
                listedProperties.push(property.name);
                this._createPropertySetting(property);
            }
            behaviorName = behavior.parentBehavior;
        }
        // TODO: Display and allow cleaning up left-over property values
    };
    BehaviorEditor.prototype._createPropertySetting = function (property) {
        var _this = this;
        var propertySetting = SupClient.table.appendRow(this.tbody, property.name, { checkbox: true, title: property.name + " (" + property.type + ")" });
        this.propertySettingsByName[property.name] = propertySetting;
        this._createPropertyField(property.name);
        propertySetting.checkbox.checked = this.config.propertyValues[property.name] != null;
        propertySetting.checkbox.addEventListener("change", function (event) {
            if (!event.target.checked) {
                _this.editConfig("clearBehaviorPropertyValue", property.name);
                return;
            }
            // defaultValue = property.value someday
            var defaultValue;
            switch (property.type) {
                case "boolean": {
                    defaultValue = false;
                    break;
                }
                case "number": {
                    defaultValue = 0;
                    break;
                }
                case "string": {
                    defaultValue = "";
                    break;
                }
                // TODO: Support more types
                default: {
                    defaultValue = null;
                    break;
                }
            }
            _this.editConfig("setBehaviorPropertyValue", property.name, property.type, defaultValue);
        });
    };
    BehaviorEditor.prototype._createPropertyField = function (propertyName) {
        var behaviorName = this.config.behaviorName;
        var property;
        while (behaviorName != null) {
            var behavior = this.behaviorPropertiesResource.pub.behaviors[behaviorName];
            property = this.behaviorPropertiesResource.propertiesByNameByBehavior[behaviorName][propertyName];
            if (property != null)
                break;
            behaviorName = behavior.parentBehavior;
        }
        var propertySetting = this.propertySettingsByName[propertyName];
        // TODO: We probably want to collect and display default values?
        // defaultPropertyValue = behaviorProperty?.value
        var propertyValue = null;
        var uiType = property.type;
        var propertyValueInfo = this.config.propertyValues[property.name];
        if (propertyValueInfo != null) {
            propertyValue = propertyValueInfo.value;
            if (propertyValueInfo.type !== property.type)
                uiType = "incompatibleType";
        }
        var propertyField;
        switch (uiType) {
            case "incompatibleType": {
                propertyField = propertySetting.valueCell.querySelector("input[type=text]");
                if (propertyField == null) {
                    propertySetting.valueCell.innerHTML = "";
                    propertyField = SupClient.table.appendTextField(propertySetting.valueCell, "");
                    propertyField.addEventListener("change", this._onChangePropertyValue);
                }
                propertyField.value = "(Incompatible type: " + propertyValueInfo.type + ")";
                propertyField.disabled = true;
                break;
            }
            case "boolean": {
                propertyField = propertySetting.valueCell.querySelector("input[type=checkbox]");
                if (propertyField == null) {
                    propertySetting.valueCell.innerHTML = "";
                    propertyField = SupClient.table.appendBooleanField(propertySetting.valueCell, false);
                    propertyField.addEventListener("change", this._onChangePropertyValue);
                }
                propertyField.checked = propertyValue;
                propertyField.disabled = propertyValueInfo == null;
                break;
            }
            case "number": {
                propertyField = propertySetting.valueCell.querySelector("input[type=number]");
                if (propertyField == null) {
                    propertySetting.valueCell.innerHTML = "";
                    propertyField = SupClient.table.appendNumberField(propertySetting.valueCell, 0);
                    propertyField.addEventListener("change", this._onChangePropertyValue);
                }
                propertyField.value = propertyValue;
                propertyField.disabled = propertyValueInfo == null;
                break;
            }
            case "string": {
                propertyField = propertySetting.valueCell.querySelector("input[type=text]");
                if (propertyField == null) {
                    propertySetting.valueCell.innerHTML = "";
                    propertyField = SupClient.table.appendTextField(propertySetting.valueCell, "");
                    propertyField.addEventListener("change", this._onChangePropertyValue);
                }
                propertyField.value = propertyValue;
                propertyField.disabled = propertyValueInfo == null;
                break;
            }
            // TODO: Support more types
            default: {
                propertySetting.valueCell.innerHTML = "";
                console.error("Unsupported property type: " + property.type);
                return;
            }
        }
        propertyField.dataset.behaviorPropertyName = property.name;
        propertyField.dataset.behaviorPropertyType = property.type;
    };
    BehaviorEditor.prototype.config_setProperty = function (path, value) {
        switch (path) {
            case "behaviorName": {
                this.behaviorNameField.value = value;
                this._buildBehaviorPropertiesUI();
                break;
            }
        }
    };
    BehaviorEditor.prototype.config_setBehaviorPropertyValue = function (name, type, value) {
        this.propertySettingsByName[name].checkbox.checked = true;
        this._createPropertyField(name);
    };
    BehaviorEditor.prototype.config_clearBehaviorPropertyValue = function (name) {
        this.propertySettingsByName[name].checkbox.checked = false;
        this._createPropertyField(name);
    };
    return BehaviorEditor;
})();
exports.default = BehaviorEditor;
