/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ipesa/zradiofrecuencia/test/integration/AllJourneys"
	], function () {
		QUnit.start();
	});
});