"use strict";
"require form";
"require fs";
"require uci";
"require ui";
"require view";

return view.extend({
  render: function () {
    var m, s, o;

    m = new form.Map(
      "dae",
      _("Configuration"),
      _("Here you can edit dae configuration. It will be hot-reloaded automatically after apply.")
    );

    s = m.section(form.TypedSection);
    s.anonymous = true;

    s = m.section(form.NamedSection, "config", "dae");

    o = s.option(form.TextValue, "_configuration");
    o.rows = 40;
    o.load = function (section_id) {
      // Use current UCI value for file path, default if not set
      let filePath = uci.get("dae", "config", "config_file") || "/etc/dae/config.dae";
      return fs
        .read_direct(filePath, "text")
        .then(function (content) {
          return content ?? "";
        })
        .catch(function (e) {
          if (e.toString().includes("NotFoundError"))
            return fs
              .read_direct("/etc/dae/example.dae", "text")
              .then(function (content) {
                return content ?? "";
              })
              .catch(function (e) {
                return "";
              });

          ui.addNotification(null, E("p", e.message));
          return "";
        });
    };
    o.write = function (section_id, value) {
      let filePath = uci.get("dae", "config", "config_file") || "/etc/dae/config.dae";
      return fs.write(filePath, value, 384 /* 0600 */).catch(function (e) {
        ui.addNotification(null, E("p", e.message));
      });
    };

    return m.render();
  },

  handleSaveApply: function (ev, mode) {
    return this.handleSave(ev).then(function () {
      return L.resolveDefault(fs.exec_direct("/etc/init.d/dae", ["hot_reload"]), null);
    });
  },
});
