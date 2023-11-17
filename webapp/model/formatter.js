sap.ui.define([], function () {
	"use strict";
	return {

		keyDescripcion: function (key, descripcion) {

			if (key && descripcion) {
				return key + " (" + descripcion + ")";
			}
			if (key && !descripcion) {
				return key;
			}
			return "";
		},

		formatDate: function (vDate) {
			if (!vDate) {
				return "";
			}
			// sumarle el offset de la zona horaria para que no muestre el dia anterior
			vDate.setMinutes(vDate.getMinutes() + vDate.getTimezoneOffset())

			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd.MM.yyyy"
			});
			var dateFormatted = dateFormat.format(vDate);
			return dateFormatted;
		},

		highlightPicking: function (bEstado) {
			if (bEstado) {
				// pickeado
				return sap.ui.core.MessageType.Success;
			}
			return sap.ui.core.MessageType.Error;
		},

		highlightPosicion: function (bFaltaPickear, bKostk) {
			if (bFaltaPickear) {
				if(bKostk !== "C"){
					// no contabilizada y falta pickear
					return sap.ui.core.MessageType.Error;
				}
				// contabilizada, no hay que pickear
				return sap.ui.core.MessageType.Success;
			}
			// pickeado
			return sap.ui.core.MessageType.Success;
		},

		estadoPicking: function (bEstado) {
			if (bEstado) {
				// pickeado
				return "Pickeado";
			}
			return "No pickeado";
		},

		colorEstadoPicking: function (bEstado) {
			if (bEstado) {
				// pickeado
				return sap.ui.core.ValueState.Success;
			}
			return sap.ui.core.ValueState.Error;
		},

		colorBotonPicking: function (bFaltaPickear) {
			if (bFaltaPickear) {
				return sap.m.ButtonType.Negative;
			} else {
				return sap.m.ButtonType.Accept;
			}
		},

		cantidadPickeada: function (cantPickeada) {
			if (!cantPickeada) {
				return "0.00";
			}
			return cantPickeada.toFixed(2);
		},
		//BEGIN - DGOMEZ - 04.02.2022
		cantidadPickeadaDec3: function (cantPickeada) {
			if (!cantPickeada) {
				return "0.000";
			}
			return cantPickeada.toFixed(3);
		},
		colorPorcentajePickeadoExacto: function (cantPickeada, total) {
			if (!total || !cantPickeada) {
				return sap.ui.core.ValueState.Error;
			}

			if (cantPickeada < total || cantPickeada > total) {
				return sap.ui.core.ValueState.Error;
			} else {
				return sap.ui.core.ValueState.Success;
			}
		},
		//END   - DGOMEZ - 04.02.2022
		cantidadPendiente: function (cantPickeada, cantTotal) {
			//BEGIN - MORANO 11.02.2022
			var nDecimales = 3; // anterior era 2
			var sTotalVacio = "0.000"; //anterior era 0.00
			//END - MORANO 11.02.2022
			if (!cantTotal) {
				return sTotalVacio;
				// return "0.00";
			}
			if (!cantPickeada) {
				return cantTotal;
			}
			var cantPendiente = cantTotal - cantPickeada;

			// return cantPendiente.toFixed( 2 );
			return cantPendiente.toFixed( nDecimales );
		},
		porcentajePickeado: function (cantPickeada, total) {
			if (!total || !cantPickeada) {
				return 0;
			}
			return cantPickeada / total * 100;
		},
		colorPorcentajePickeado: function (cantPickeada, total) {
			if (!total || !cantPickeada) {
				return sap.ui.core.ValueState.Error;
			}

			if (cantPickeada < total) {
				return sap.ui.core.ValueState.Error;
			} else {
				return sap.ui.core.ValueState.Success;
			}
		},

		/* Formatters del popover de mensajes */
		tipoBotonMensajes: function (maxPrioridad) {
			switch (maxPrioridad) {
			case "Error":
				return sap.m.ButtonType.Reject;
			case "Warning":
				return sap.m.ButtonType.Emphasized;
			case "Success":
				return sap.m.ButtonType.Success;
			}

			return sap.m.ButtonType.Neutral;
		},

		/* Formatters del popover de mensajes */
		iconoBotonMensajes: function (maxPrioridad) {
			switch (maxPrioridad) {
			case "Error":
				return "sap-icon://message-error";
			case "Warning":
				return "sap-icon://message-warning";
			case "Success":
				return "sap-icon://message-success";
			}

			return "sap-icon://message-information";
		}

	};
});