sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"ipesa/zradiofrecuenciaV2/model/models",
	"ipesa/zradiofrecuenciaV2/libs/Html5Qrcode",
	'sap/m/ColumnListItem',
	'sap/m/Label',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	"../model/formatter",
	'sap/m/MessagePopover',
	'sap/m/MessageItem',
	'sap/m/MessageToast',
], function(Controller, JSONModel, MessageBox, models, Html5Qrcodejs, ColumnListItem, Label, Filter, FilterOperator, formatter,
	MessagePopover, MessageItem, MessageToast) {
	"use strict";
	var html5QrCode;
	return Controller.extend("ipesa.zradiofrecuenciaV2.controller.Main", {
		formatter: formatter,

		onInit: function() {
			console.log("Radiofrec. con cambios 23/08/2023")
			console.log("cambios 16 de noviembre");
			// setear el modelo a la vista main
			this.getView().setModel(this.getOwnerComponent().getModel());
			this.getView().getModel().setUseBatch(false);

			// guardar referencia a los textos
			this.oTextos = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			// guardar flag si es mobile
			this.oDeviceModel = this.getOwnerComponent().getModel("device");
			this.isPhone = this.getOwnerComponent().getModel("device").getProperty("/system/phone");

			// setear modelo que guarda los datos ingresados en la app
			this.getOwnerComponent().setModel(models.createAppModel(), "appModel");
			// mismo modelo vac�o para copiar cuando hay que limpiar los datos
			this.getOwnerComponent().setModel(models.createAppModel(), "appModelLimpio");

			// setear modelo de config de valuehelps
			this.getOwnerComponent().setModel(models.createValueHelpModel(), "valuehelpModel");

			// setear modelo de mensajes
			this.getView().setModel(new JSONModel([]), "messageModel");

			// crear popover de mensajes
			this.initMessagePopover();

			// busy al hacer operaciones sobre el odata que va a SAP
			this.getView().getModel().attachRequestSent(function() {
				sap.ui.core.BusyIndicator.show(0);
			});
			this.getView().getModel().attachRequestCompleted(function() {
				sap.ui.core.BusyIndicator.hide();
			});

			// leer par�metros del usuario
			this.getUserParams();
		},

		/* Leer par�metros del usuario y setearlos en appModel>/UserConfig/XXX */
		getUserParams: function() {
			var that = this;
			var mensajeError = that.oTextos.getText("error_configuracion_usuario");
			this.getView().getModel().read("/USR_PARAMSet", {
				success: function(oResponse) {
					if (oResponse.results.length > 0) {
						// transformar para acceder por key y setear a appModel>/UserConfig
						for (var result of oResponse.results) {
							that.getView().getModel("appModel").setProperty("/UserConfig/" + result.Parid, result);
						}
					} else {
						MessageBox.error(mensajeError, {
							details: oResponse
						});
					}
				},
				error: function(oError) {
					MessageBox.error(mensajeError, {
						details: oError
					});
				}
			})
		},

		actualizar: function(entidad, datos = {}) {
			var oModel = this.getView().getModel();

			return new Promise(function(resolve, reject) {
				oModel.create(entidad, datos, {
					success: function(res) {
						resolve(new JSONModel(res));
					},
					error: function(err) {
						reject(err);
					}
				});
			})
		},

		/********************  Inicio control del menu *****************************************************************************************/
		/* Abrir el menu lateral desde la p�gina de inicio */
		openSideMenu: function() {
			var oToolPage = this.byId("idToolPage");
			oToolPage.setSideExpanded(true);
		},

		/* Clic en un item del menu lateral */
		onMenuItemSelected: function(oEvent) {
			var oItem = oEvent.getParameter("item");
			var key = oItem.getKey();
			if (key) {
				// navegar a la pagina que coincide con la key
				this.byId("idPageContainer").to(this.getView().createId(key));

				// si es mobile hay que ocultar el menu
				if (this.isPhone) {
					var oToolPage = this.byId("idToolPage");
					oToolPage.setSideExpanded(false);
				}

				// obtener titulos de la operacion
				var oOperacion = this.getView().getModel("appModel").getData()[key];
				// setear titulos globalmente
				if (oOperacion) {
					this.getView().getModel("appModel").setProperty("/Titulo", oOperacion.Titulo + " (((" + key + ")))");
					this.getView().getModel("appModel").setProperty("/Subtitulo", oOperacion.Subtitulo);
				} else {
					this.getView().getModel("appModel").setProperty("/Titulo", "");
					this.getView().getModel("appModel").setProperty("/Subtitulo", "");
				}
				var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

				switch (key) {
					case "RecepcionTrasladosConHU":
						this.getView().getModel("appModel").setProperty("/RecepcionTrasladosConHU/Datos/Centro", centroUsuario);
						break;
					case "TrasladoEntreAlmacenes1PasoSinHU":
						this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/Centro", centroUsuario);
						break;
					case "TrasladoEntreAlmacenes2PasoSinHUSalida":
						this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/Centro", centroUsuario);
						break;
					case "TrasladoEntreAlmacenes2PasoSinHUEntrada":
						this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/Centro", centroUsuario);
						break;
					case "TrasladoEntreCentrosPickingEntregaSalida":
						this.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/Centro", centroUsuario);
						break;
					case "EntregaPedidoVentasPickingEntregaSalida":
						this.getView().getModel("appModel").setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Centro", centroUsuario);
						break;
					case "TrasladoEntreCentrosConPedidoPickingEntregaSalida":
						this.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/Centro", centroUsuario);
						break;
					case "RepackingMaterial":
						this.getView().getModel("appModel").setProperty("/RepackingMaterial/Datos/Centro", centroUsuario);
						break;
					case "TrasladoEntreAlmacenes2PasoConHUEntrada":
						this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/Centro", centroUsuario);
						break;
					case "InventariosSinUmp":
						this.getView().getModel("appModel").setProperty("/InventariosSinUmp/Datos/Centro", centroUsuario);
						break;
					case "InventariosConUmp":
						this.getView().getModel("appModel").setProperty("/InventariosConUmp/Datos/Centro", centroUsuario);
						break;
					case "ConsultaStock":
						this.getView().getModel("appModel").setProperty("/ConsultaStock/Datos/Centro", centroUsuario);
						break;
					case "ConsultaLotes":
						this.getView().getModel("appModel").setProperty("/ConsultaLotes/Datos/Centro", centroUsuario);
						break;
				};

			} else {
				// contraer o desplegar, ya que si no tiene key es un menu padre
				oItem.setExpanded(!oItem.getExpanded());
			}
		},

		/* Toggle de visibilidad del menu lateral */
		onSideNavButtonPress: function() {
			var oToolPage = this.byId("idToolPage");
			oToolPage.setSideExpanded(!oToolPage.getSideExpanded());
		},

		/* Metodo de prueba de scanner de QR*/
		probarScanner: function() {
			this.escanearCodigo(this)
				.then((codigo) => {
					// hacer algo con el codigo
					MessageBox.success(codigo);
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/********************  Fin control del menu ***********************************************************************************************/

		/********************  Inicio TrasladoEntreAlmacenes1PasoSinHU *****************************************************************************/
		//Centro
		onValueHelp_TrasladoEntreAlmacenes1PasoSinHU_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/Centro", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/CentroDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes1PasoSinHU();
			});

		},
		/* Value help de almacen origen, pasa filtro del centro del usuario */
		onValueHelp_TrasladoEntreAlmacenes1PasoSinHU_Almacen: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/Almacen", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/AlmacenDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes1PasoSinHU();
			});

		},

		/* Value help de almacen destino */
		onValueHelp_TrasladoEntreAlmacenes1PasoSinHU_AlmacenDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos");
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/AlmacenDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/AlmacenDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes1PasoSinHU();
			});

		},

		/* Value help de lote */
		onValueHelp_TrasladoEntreAlmacenes1PasoSinHU_Lote: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			// filtro centro
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// filtro material
			if (oData.Material) {
				aFilters.push(new Filter({
					path: 'Matnr',
					operator: FilterOperator.EQ,
					value1: oData.Material
				}));
			}

			// llamar al value help gen�rico
			this._openValueHelp('LOTE', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/Lote", oObject.key);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes1PasoSinHU();
			});

		},

		/* Value help de material */
		onValueHelp_TrasladoEntreAlmacenes1PasoSinHU_Material: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos");

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "L"
			})];

			var aFilters = [new sap.ui.model.Filter({
				path: "Werks",
				operator: FilterOperator.EQ,
				value1: oData.Centro
			})];

			var that = this;
			// llamar al value help gen�rico
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/Material", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/MaterialDescripcion", oObject.descripcion);
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/Cantidad", 0);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes1PasoSinHU();

				// obtener la unidad y pegarla en el modelo
				var sPath = that.getView().getModel().createKey("/F4_MATNRSet", {
					Matnr: oObject.key
				});
				var oMaterial = that.getView().getModel().getObject(sPath);
				if (oMaterial) {
					oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/CantidadUM", oMaterial.Meins);
				} else {
					oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos/CantidadUM", "");
				}

			});

		},

		/* Validaciones de la operaci�n TrasladoEntreAlmacenes1PasoSinHU */
		onValidaciones_TrasladoEntreAlmacenes1PasoSinHU: function() {
			// Validar que los datos de appModel>/TrasladoEntreAlmacenes1PasoSinHU/Datos est�n cargados
			//  y setear appModel>/TrasladoEntreAlmacenes1PasoSinHU/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos");

			if (!oData.Material || !oData.Almacen || !oData.Cantidad || !oData.Lote || !oData.AlmacenDestino) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes1PasoSinHU/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n TrasladoEntreAlmacenes1PasoSinHU (contabilizar) */
		onAccionPrincipal_TrasladoEntreAlmacenes1PasoSinHU: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreAlmacenes1PasoSinHU/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes1PasoSinHU/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			if (!this.onValidaciones_TrasladoEntreAlmacenes1PasoSinHU()) {
				return;
			}

			var oRequest = {
				Bwart: oData.ClaseMovimiento,
				Werks: oData.Centro,
				Charg: oData.Lote,
				Commit: "X",
				Matnr: oData.Material,
				LgortIn: oData.Almacen,
				LgortOut: oData.AlmacenDestino,
				Meins: oData.CantidadUM,
				Qty: oData.Cantidad,
				GmCreate_To_Bapiret2Nav: []
			};

			this.getView().getModel().create("/GM_CREATESet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.GmCreate_To_Bapiret2Nav.results) {
						var item = oResponse.GmCreate_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.GmCreate_To_Bapiret2Nav.results, "TrasladoEntreAlmacenes1PasoSinHU");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreAlmacenes1PasoSinHU_success", [oResponse.E_MatDoc, oResponse.E_DocYear]));

						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "TrasladoEntreAlmacenes1PasoSinHU");
					}
					that._openMessagePopover();

				},
				error: that._errorOdata
			})

		},

		/********************  Fin TrasladoEntreAlmacenes1PasoSinHU *****************************************************************************/

		/********************  Inicio TrasladoEntreAlmacenes2PasoSinHUEntrada *****************************************************************************/

		//Centro
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUEntrada_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/Centro", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/CentroDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUEntrada();
			});

		},
		/* Value help de almacen origen, pasa filtro del centro del usuario */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUEntrada_Almacen: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/Almacen", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/AlmacenDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUEntrada();
			});

		},

		/* Value help de almacen destino */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUEntrada_AlmacenDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/AlmacenDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/AlmacenDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUEntrada();
			});

		},

		/* Value help de lote */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUEntrada_Lote: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			// filtro centro
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// filtro material
			if (oData.Material) {
				aFilters.push(new Filter({
					path: 'Matnr',
					operator: FilterOperator.EQ,
					value1: oData.Material
				}));
			}

			// llamar al value help gen�rico
			this._openValueHelp('LOTE', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/Lote", oObject.key);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUEntrada();
			});

		},

		/* Value help de material */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUEntrada_Material: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos");

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "L"
			})];

			var aFilters = [new sap.ui.model.Filter({
				path: "Werks",
				operator: FilterOperator.EQ,
				value1: oData.Centro
			})];

			var that = this;
			// llamar al value help gen�rico
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/Material", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/MaterialDescripcion", oObject.descripcion);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/Cantidad", 0);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUEntrada();

				// obtener la unidad y pegarla en el modelo
				var sPath = that.getView().getModel().createKey("/F4_MATNRSet", {
					Matnr: oObject.key
				});
				var oMaterial = that.getView().getModel().getObject(sPath);
				if (oMaterial) {
					oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/CantidadUM", oMaterial.Meins);
				} else {
					oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos/CantidadUM", "");
				}
			});

		},

		/* Validaciones de la operaci�n TrasladoEntreAlmacenes2PasoSinHUEntrada */
		onValidaciones_TrasladoEntreAlmacenes2PasoSinHUEntrada: function() {
			// Validar que los datos de appModel>/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos est�n cargados
			//  y setear appModel>/TrasladoEntreAlmacenes2PasoSinHUEntrada/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos");

			if (!oData.Material || !oData.Almacen || !oData.Cantidad || !oData.Lote || !oData.AlmacenDestino) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n TrasladoEntreAlmacenes2PasoSinHUEntrada (contabilizar) */
		onAccionPrincipal_TrasladoEntreAlmacenes2PasoSinHUEntrada: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoSinHUEntrada/Datos");
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			if (!this.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUEntrada()) {
				return;
			}

			var oRequest = {
				Bwart: oData.ClaseMovimiento,
				Werks: oData.Centro,
				Charg: oData.Lote,
				Commit: "X",
				Matnr: oData.Material,
				LgortIn: oData.Almacen,
				LgortOut: oData.AlmacenDestino,
				Meins: oData.CantidadUM,
				Qty: oData.Cantidad,
				GmCreate_To_Bapiret2Nav: []
			};

			this.getView().getModel().create("/GM_CREATESet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.GmCreate_To_Bapiret2Nav.results) {
						var item = oResponse.GmCreate_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.GmCreate_To_Bapiret2Nav.results, "TrasladoEntreAlmacenes2PasoSinHUEntrada");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreAlmacenes2PasoSinHUEntrada_success", [oResponse.E_MatDoc, oResponse.E_DocYear]));

						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "TrasladoEntreAlmacenes2PasoSinHUEntrada");
					}
					that._openMessagePopover();

				},
				error: that._errorOdata
			})

		},

		/********************  Fin TrasladoEntreAlmacenes2PasoSinHUEntrada *****************************************************************************/

		/********************  Inicio TrasladoEntreAlmacenes2PasoSinHUSalida *****************************************************************************/
		//Centro
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUSalida_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/Centro", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/CentroDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUSalida();
			});

		},

		/* Value help de almacen origen, pasa filtro del centro del usuario */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUSalida_Almacen: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			var that = this;

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/Almacen", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/AlmacenDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUSalida();

			});

		},

		/* Value help de almacen destino */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUSalida_AlmacenDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/AlmacenDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/AlmacenDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUSalida();
			});

		},

		/* Value help de lote */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUSalida_Lote: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			// filtro centro
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// filtro material
			if (oData.Material) {
				aFilters.push(new Filter({
					path: 'Matnr',
					operator: FilterOperator.EQ,
					value1: oData.Material
				}));
			}

			// llamar al value help gen�rico
			this._openValueHelp('LOTE', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/Lote", oObject.key);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUSalida();
			});

		},

		/* Value help de material */
		onValueHelp_TrasladoEntreAlmacenes2PasoSinHUSalida_Material: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos");

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "L"
			})];

			var aFilters = [new sap.ui.model.Filter({
				path: "Werks",
				operator: FilterOperator.EQ,
				value1: oData.Centro
			})];

			var that = this;
			// llamar al value help gen�rico
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/Material", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/MaterialDescripcion", oObject.descripcion);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/Cantidad", 0);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUSalida();

				// obtener la unidad y pegarla en el modelo
				var sPath = that.getView().getModel().createKey("/F4_MATNRSet", {
					Matnr: oObject.key
				});
				var oMaterial = that.getView().getModel().getObject(sPath);
				if (oMaterial) {
					oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/CantidadUM", oMaterial.Meins);
				} else {
					oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos/CantidadUM", "");
				}
			});

		},

		/* Validaciones de la operaci�n TrasladoEntreAlmacenes2PasoSinHUSalida */
		onValidaciones_TrasladoEntreAlmacenes2PasoSinHUSalida: function() {
			// Validar que los datos de appModel>/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos est�n cargados
			//  y setear appModel>/TrasladoEntreAlmacenes2PasoSinHUSalida/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos");

			if (!oData.Material || !oData.Almacen || !oData.Cantidad || !oData.Lote || !oData.AlmacenDestino) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n TrasladoEntreAlmacenes2PasoSinHUSalida (contabilizar) */
		onAccionPrincipal_TrasladoEntreAlmacenes2PasoSinHUSalida: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoSinHUSalida/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			if (!this.onValidaciones_TrasladoEntreAlmacenes2PasoSinHUSalida()) {
				return;
			}
			var oRequest = {
				Bwart: oData.ClaseMovimiento,
				Werks: oData.Centro,
				Charg: oData.Lote,
				Commit: "X",
				Matnr: oData.Material,
				LgortIn: oData.Almacen,
				LgortOut: oData.AlmacenDestino,
				Meins: oData.CantidadUM,
				Qty: oData.Cantidad,
				GmCreate_To_Bapiret2Nav: []
			};

			this.getView().getModel().create("/GM_CREATESet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.GmCreate_To_Bapiret2Nav.results) {
						var item = oResponse.GmCreate_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.GmCreate_To_Bapiret2Nav.results, "TrasladoEntreAlmacenes2PasoSinHUSalida");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreAlmacenes2PasoSinHUSalida_success", [oResponse.E_MatDoc, oResponse.E_DocYear]));

						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "TrasladoEntreAlmacenes2PasoSinHUSalida");
					}
					that._openMessagePopover();

				},
				error: that._errorOdata
			})

		},

		/********************  Fin TrasladoEntreAlmacenes2PasoSinHUSalida *****************************************************************************/

		/********************  Inicio TrasladoEntreAlmacenes1PasoConHU *****************************************************************************/

		/* Value help de almacen destino */
		onValueHelp_TrasladoEntreAlmacenes1PasoConHU_AlmacenDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos");
			var that = this;
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			// filtro centro
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos/AlmacenDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos/AlmacenDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes1PasoConHU();
			});

		},

		/* Submit de una ump ingresada manualmente, obtiene detalle del odata y la agrega a la lista */
		onSubmit_UMp_TrasladoEntreAlmacenes1PasoConHU: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// agregar la ump a la lista
				this.agregarUmp_TrasladoEntreAlmacenes1PasoConHU(aUmp[0]);
				// limpiar el input
				oSource.setValue("");
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		/* Escaneo de ump con la camara, luego obtiene detalle del odata y la agrega a la lista */
		onEscanear_UMp_TrasladoEntreAlmacenes1PasoConHU: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// agregar la ump a la lista
						this.agregarUmp_TrasladoEntreAlmacenes1PasoConHU(aUmp[0]);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Agregar un UMP escaneado <<y validado>> a la lista */
		agregarUmp_TrasladoEntreAlmacenes1PasoConHU: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			// generar key
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;
			oListaUMp[key] = ump;

			oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_agregada", [ump.Exidv]));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreAlmacenes1PasoConHU();
		},

		onDelete_UMp_TrasladoEntreAlmacenes1PasoConHU: function(oEvent) {
			// obtener key de la linea borrada
			var ump = oEvent.getParameter("listItem").getBindingContext("appModel").getObject();
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			delete oListaUMp[key];

			oAppModel.setProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_eliminada"));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreAlmacenes1PasoConHU();
		},

		/* Validaciones de la operaci�n TrasladoEntreAlmacenes1PasoConHU */
		onValidaciones_TrasladoEntreAlmacenes1PasoConHU: function() {
			// Validar que los datos de appModel>/TrasladoEntreAlmacenes1PasoConHU/Datos est�n cargados
			//  y setear appModel>/TrasladoEntreAlmacenes1PasoConHU/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos");

			var cantUMp = Object.keys(oData.ListaUMp).length;
			if (!oData.AlmacenDestino || cantUMp === 0) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes1PasoConHU/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n TrasladoEntreAlmacenes1PasoConHU (contabilizar movimiento) */
		onAccionPrincipal_TrasladoEntreAlmacenes1PasoConHU: async function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreAlmacenes1PasoConHU/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes1PasoConHU/Datos");

			if (!this.onValidaciones_TrasladoEntreAlmacenes1PasoConHU()) {
				return;
			}

			var sAlmacenDestino = oData.AlmacenDestino;

			var oRequest = {
				Lgort: oData.AlmacenDestino,
				Event: oData.ClaseMovimiento,
				Commit: "X",
				GmCreateHu_To_GmCreateHuKeyNav: [],
				GmCreateHu_To_Bapiret2Nav: [] // mensajes de bapi
			};

			var revisar_almacen_destino = false;
			var revisar_almacen_origen = false;

			for (var ump in oData.ListaUMp) {
				var sAlmacenOrigen = oData.ListaUMp[ump].Lgort;
				var coincide_almacen = sAlmacenOrigen == "0037" || sAlmacenOrigen == "0039";
				if (coincide_almacen && sAlmacenDestino != "0040") revisar_almacen_destino = true;

				var comprobar_almacen = sAlmacenDestino == "0040";
				var no_coincide_almacen_origen = sAlmacenOrigen != "0037" &&
					sAlmacenOrigen != "0039" &&
					sAlmacenOrigen != "";
				var coinciden_condiciones = comprobar_almacen && no_coincide_almacen_origen;
				if (coinciden_condiciones) revisar_almacen_origen = true;

				oRequest.GmCreateHu_To_GmCreateHuKeyNav.push({
					Lgort: oData.AlmacenDestino,
					HuExid: oData.ListaUMp[ump].Exidv
				});
			}

			if (revisar_almacen_destino || revisar_almacen_origen) {
				var confirmacion = await new Promise(resolve => {
					MessageBox.warning("Confirmar", {
						details: "Se debe revisar el almacén de origen, desea continuar?",
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						onClose: function(sAction) {
							var confirmado = sAction == "YES";
							resolve(confirmado);
						}
					});
				});

				if (!confirmacion) return;
			}

			this.getView().getModel().create("/GM_CREATE_HUSet", oRequest, {
				success: function(oResponse, oHeader) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.GmCreateHu_To_Bapiret2Nav.results) {
						var item = oResponse.GmCreateHu_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.GmCreateHu_To_Bapiret2Nav.results, "TrasladoEntreAlmacenes1PasoConHU");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreAlmacenes1PasoConHU_success"));
					}

					that._openMessagePopover();
					// limpiar los datos de este objeto del modelo
					that._onLimpiarPantalla(null, "TrasladoEntreAlmacenes1PasoConHU");
				},
				error: that._errorOdata
			})

		},

		/********************  Fin TrasladoEntreAlmacenes1PasoConHU *****************************************************************************/

		/********************  Inicio TrasladoEntreAlmacenes2PasoConHUSalida *****************************************************************************/

		/* Value help de almacen destino */
		onValueHelp_TrasladoEntreAlmacenes2PasoConHUSalida_AlmacenDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos");
			var that = this;
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			// filtro centro
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));
			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos/AlmacenDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos/AlmacenDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoConHUSalida();
			});

		},

		/* Submit de una ump ingresada manualmente, obtiene detalle del odata y la agrega a la lista */
		onSubmit_UMp_TrasladoEntreAlmacenes2PasoConHUSalida: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// agregar la ump a la lista
				this.agregarUmp_TrasladoEntreAlmacenes2PasoConHUSalida(aUmp[0]);
				// limpiar el input
				oSource.setValue("");
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		/* Escaneo de ump con la camara, luego obtiene detalle del odata y la agrega a la lista */
		onEscanear_UMp_TrasladoEntreAlmacenes2PasoConHUSalida: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// agregar la ump a la lista
						this.agregarUmp_TrasladoEntreAlmacenes2PasoConHUSalida(aUmp[0]);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Agregar un UMP escaneado <<y validado>> a la lista */
		agregarUmp_TrasladoEntreAlmacenes2PasoConHUSalida: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			// generar key
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;
			oListaUMp[key] = ump;

			oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_agregada", [ump.Exidv]));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreAlmacenes2PasoConHUSalida();
		},

		onDelete_UMp_TrasladoEntreAlmacenes2PasoConHUSalida: function(oEvent) {
			// obtener key de la linea borrada
			var ump = oEvent.getParameter("listItem").getBindingContext("appModel").getObject();
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			delete oListaUMp[key];

			oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_eliminada"));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreAlmacenes2PasoConHUSalida();
		},

		/* Validaciones de la operaci�n TrasladoEntreAlmacenes2PasoConHUSalida */
		onValidaciones_TrasladoEntreAlmacenes2PasoConHUSalida: function() {
			// Validar que los datos de appModel>/TrasladoEntreAlmacenes2PasoConHUSalida/Datos est�n cargados
			//  y setear appModel>/TrasladoEntreAlmacenes2PasoConHUSalida/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos");

			var cantUMp = Object.keys(oData.ListaUMp).length;
			if (!oData.AlmacenDestino || cantUMp === 0) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n TrasladoEntreAlmacenes2PasoConHUSalida (contabilizar movimiento) */
		onAccionPrincipal_TrasladoEntreAlmacenes2PasoConHUSalida: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreAlmacenes2PasoConHUSalida/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoConHUSalida/Datos");

			if (!this.onValidaciones_TrasladoEntreAlmacenes2PasoConHUSalida()) {
				return;
			}

			var oRequest = {
				Lgort: oData.AlmacenDestino,
				Event: oData.ClaseMovimiento,
				Commit: "X",
				GmCreateHu_To_GmCreateHuKeyNav: [],
				GmCreateHu_To_Bapiret2Nav: [] // mensajes de bapi
			};

			for (var ump in oData.ListaUMp) {
				oRequest.GmCreateHu_To_GmCreateHuKeyNav.push({
					Lgort: oData.AlmacenDestino,
					HuExid: oData.ListaUMp[ump].Exidv
				});
			}

			this.getView().getModel().create("/GM_CREATE_HUSet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.GmCreateHu_To_Bapiret2Nav.results) {
						var item = oResponse.GmCreateHu_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.GmCreateHu_To_Bapiret2Nav.results, "TrasladoEntreAlmacenes2PasoConHUSalida");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreAlmacenes2PasoConHUSalida_success"));
					}
					that._openMessagePopover();

					// limpiar los datos de este objeto del modelo
					that._onLimpiarPantalla(null, "TrasladoEntreAlmacenes2PasoConHUSalida");
				},
				error: that._errorOdata
			})

		},

		/********************  Fin TrasladoEntreAlmacenes2PasoConHUSalida *****************************************************************************/

		/********************  Inicio TrasladoEntreAlmacenes2PasoConHUEntrada *****************************************************************************/

		/* Value help de almacen destino */
		onValueHelp_TrasladoEntreAlmacenes2PasoConHUEntrada_AlmacenDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos");
			var that = this;
			var centroUsuario = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/Centro");

			// filtro centro
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));
			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/AlmacenDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/AlmacenDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada();
			});

		},

		onValueHelp_TrasladoEntreAlmacenes2PasoConHUEntrada_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/Centro", oObject.key);
				oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/CentroDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada();
			});

		},

		/* Submit de una ump ingresada manualmente, obtiene detalle del odata y la agrega a la lista */
		onSubmit_UMp_TrasladoEntreAlmacenes2PasoConHUEntrada: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();
			var tblConBalanza = this.getView().byId("tblConBalanza");
			var tblSinBalanza = this.getView().byId("tblSinBalanza");
			var almacenDestino = this.getView().getModel("appModel").getProperty(
				"/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/AlmacenDestino");

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// agregar la ump a la lista
				this.agregarUmp_TrasladoEntreAlmacenes2PasoConHUEntrada(aUmp[0]);
				// limpiar el input
				oSource.setValue("");
				if (almacenDestino != "0040") {
					if (!tblConBalanza.getVisible()) {
						tblSinBalanza.setVisible(true);
					}
				} else {
					if (aUmp[0].CheckBf == 'X') {
						if (!tblSinBalanza.getVisible()) {
							tblConBalanza.setVisible(true);
						}
					} else {
						if (!tblConBalanza.getVisible()) {
							tblSinBalanza.setVisible(true);
						}
					}
				};

			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		/* Escaneo de ump con la camara, luego obtiene detalle del odata y la agrega a la lista */
		onEscanear_UMp_TrasladoEntreAlmacenes2PasoConHUEntrada: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// agregar la ump a la lista
						this.agregarUmp_TrasladoEntreAlmacenes2PasoConHUEntrada(aUmp[0]);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Agregar un UMP escaneado <<y validado>> a la lista */
		agregarUmp_TrasladoEntreAlmacenes2PasoConHUEntrada: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			// generar key
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;
			oListaUMp[key] = ump;

			oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_agregada", [ump.Exidv]));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada();
		},

		onDelete_UMp_TrasladoEntreAlmacenes2PasoConHUEntrada: function(oEvent) {
			// obtener key de la linea borrada
			var ump = oEvent.getParameter("listItem").getBindingContext("appModel").getObject();
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			delete oListaUMp[key];

			oAppModel.setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_eliminada"));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada();
		},

		/* Validaciones de la operaci�n TrasladoEntreAlmacenes2PasoConHUEntrada */
		onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada: function() {
			// Validar que los datos de appModel>/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos est�n cargados
			//  y setear appModel>/TrasladoEntreAlmacenes2PasoConHUEntrada/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos");

			var cantUMp = Object.keys(oData.ListaUMp).length;
			if (!oData.AlmacenDestino || cantUMp === 0) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n TrasladoEntreAlmacenes2PasoConHUEntrada (contabilizar movimiento) */
		onAccionPrincipal_TrasladoEntreAlmacenes2PasoConHUEntrada: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreAlmacenes2PasoConHUEntrada/Datos");
			var sPesoBf;

			if (!this.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada()) {
				return;
			}

			var oRequest = {
				Lgort: oData.AlmacenDestino,
				Werks: oData.Centro,
				Event: oData.ClaseMovimiento,
				Commit: "X",
				GmCreateHu_To_GmCreateHuKeyNav: [],
				GmCreateHu_To_Bapiret2Nav: [] // mensajes de bapi
			};

			for (var ump in oData.ListaUMp) {

				if (oData.ListaUMp[ump].PesoBf && oData.ListaUMp[ump].PesoBf.length > 0) {
					sPesoBf = oData.ListaUMp[ump].PesoBf[0];
				} else {
					sPesoBf = "0";
				}

				oRequest.GmCreateHu_To_GmCreateHuKeyNav.push({
					GeweiMax: "",
					Lgort: oData.AlmacenDestino,
					HuExid: oData.ListaUMp[ump].Exidv,
					PesoBf: sPesoBf.toString()
				});
			}

			this.getView().getModel().create("/GM_CREATE_HUSet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.GmCreateHu_To_Bapiret2Nav.results) {
						var item = oResponse.GmCreateHu_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.GmCreateHu_To_Bapiret2Nav.results, "TrasladoEntreAlmacenes2PasoConHUEntrada");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreAlmacenes2PasoConHUEntrada_success"));
					}
					that._openMessagePopover();

					// limpiar los datos de este objeto del modelo
					that._onLimpiarPantalla(null, "TrasladoEntreAlmacenes2PasoConHUEntrada");
				},
				error: that._errorOdata
			})

		},

		/********************  Fin TrasladoEntreAlmacenes2PasoConHUEntrada *****************************************************************************/

		/********************  Inicio TrasladoEntreCentrosCreacionEntregaSalida *****************************************************************************/

		/* Value help de centro destino */
		onValueHelp_TrasladoEntreCentrosCreacionEntregaSalida_CentroDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos");
			var that = this;

			// llamar al value help gen�rico
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/CentroDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/CentroDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreCentrosCreacionEntregaSalida();
			});

		},

		/* Value help de almacen destino */
		onValueHelp_TrasladoEntreCentrosCreacionEntregaSalida_AlmacenDestino: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos");
			var that = this;

			// pasar de filtro el centro destino seleccionado
			if (oData.CentroDestino) {
				aFilters.push(new Filter({
					path: 'Werks',
					operator: FilterOperator.EQ,
					value1: oData.CentroDestino
				}));
			}

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/AlmacenDestino", oObject.key);
				oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/AlmacenDestinoDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreCentrosCreacionEntregaSalida();
			});

		},

		/* Submit de una ump ingresada manualmente, obtiene detalle del odata y la agrega a la lista */
		onSubmit_UMp_TrasladoEntreCentrosCreacionEntregaSalida: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// agregar la ump a la lista
				this.agregarUmp_TrasladoEntreCentrosCreacionEntregaSalida(aUmp[0]);
				// limpiar el input
				oSource.setValue("");
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		/* Escaneo de ump con la camara, luego obtiene detalle del odata y la agrega a la lista */
		onEscanear_UMp_TrasladoEntreCentrosCreacionEntregaSalida: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// agregar la ump a la lista
						this.agregarUmp_TrasladoEntreCentrosCreacionEntregaSalida(aUmp[0]);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Agregar un UMP escaneado <<y validado>> a la lista */
		agregarUmp_TrasladoEntreCentrosCreacionEntregaSalida: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			// generar key
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;
			oListaUMp[key] = ump;
			var TotBultos = 0;
			var TotPallets = 0;
			var TotBruto = 0;
			for (var umpAux in oListaUMp) {
				TotBultos = TotBultos + oListaUMp[umpAux].CantBultos;
				TotPallets = TotPallets + 1;
				TotBruto = TotBruto + parseFloat(oListaUMp[umpAux].Brgew);

			}
			//TotBruto.toFixed(3);
			oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/TotalBultos", TotBultos);
			oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/TotalPallets", TotPallets);
			oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/TotalBruto", TotBruto);

			oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_agregada", [ump.Exidv]));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreCentrosCreacionEntregaSalida();
		},

		onDelete_UMp_TrasladoEntreCentrosCreacionEntregaSalida: function(oEvent) {
			// obtener key de la linea borrada
			var ump = oEvent.getParameter("listItem").getBindingContext("appModel").getObject();
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			delete oListaUMp[key];

			oAppModel.setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_eliminada"));

			// disparar validaciones
			this.onValidaciones_TrasladoEntreAlmacenes1PasoConHU();
		},

		/* Validaciones de la operaci�n TrasladoEntreCentrosCreacionEntregaSalida */
		onValidaciones_TrasladoEntreCentrosCreacionEntregaSalida: function() {
			// Validar que los datos de appModel>/TrasladoEntreCentrosCreacionEntregaSalida/Datos est�n cargados
			//  y setear appModel>/TrasladoEntreCentrosCreacionEntregaSalida/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos");

			var cantUMp = Object.keys(oData.ListaUMp).length;
			if (!oData.AlmacenDestino || !oData.CentroDestino || cantUMp === 0) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n TrasladoEntreCentrosCreacionEntregaSalida (contabilizar movimiento) */
		onAccionPrincipal_TrasladoEntreCentrosCreacionEntregaSalida: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreCentrosCreacionEntregaSalida/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosCreacionEntregaSalida/Datos");

			if (!this.onValidaciones_TrasladoEntreCentrosCreacionEntregaSalida()) {
				return;
			}

			var oRequest = {
				Lgort: oData.AlmacenDestino,
				Werks: oData.CentroDestino,
				OutDeliGmCreate_to_UmpNav: [],
				OutDeliGmCreate_To_Bapiret2Nav: []
			};

			for (var ump in oData.ListaUMp) {
				oRequest.OutDeliGmCreate_to_UmpNav.push({
					Lgort: oData.AlmacenDestino,
					Werks: oData.CentroDestino,
					Hu_Exid: oData.ListaUMp[ump].Exidv
				});
			}

			this.getView().getModel().create("/OUT_DELI_GM_CREATESet", oRequest, {
				success: function(oResponse, oHeader) {
					var oListaMensajesMostrar = new Array();
					var oListaMensajes = oResponse.OutDeliGmCreate_To_Bapiret2Nav.results;
					var existe_error = oListaMensajes.some(e => e.Type == "E");

					if (existe_error) {
						try {
							var lista_mensajes = oListaMensajes.map(e => e.Message);
							var mensaje_principal = "";
							lista_mensajes.map(mensaje => {
								mensaje_principal += " " + mensaje + "\n ";
							});
							var primer_objeto_mensaje = oListaMensajes[0];
							primer_objeto_mensaje.Type = "E";
							primer_objeto_mensaje.Message = mensaje_principal;
							oListaMensajesMostrar.push(primer_objeto_mensaje);
							oListaMensajes = oListaMensajesMostrar;
						} catch (error) {
							/**/
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oListaMensajes, "TrasladoEntreCentrosCreacionEntregaSalida");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (existe_error) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "TrasladoEntreCentrosCreacionEntregaSalida");
						MessageBox.success(that.oTextos.getText("TrasladoEntreCentrosCreacionEntregaSalida_success", [oResponse.OutDeli]));
					}
					that._openMessagePopover();
				},
				error: that._errorOdata
			});

		},

		/********************  Fin TrasladoEntreCentrosCreacionEntregaSalida *****************************************************************************/

		/********************  Inicio RecepcionTrasladosSinHU *****************************************************************************/

		/* Value help de entrega */
		onValueHelp_RecepcionTrasladosSinHU_Entrega: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RecepcionTrasladosSinHU/Datos");
			var that = this;

			aFilters.push(new Filter({
				path: 'Type',
				operator: FilterOperator.EQ,
				value1: 'R' // entrega recepci�n sin HU
			}));
			// llamar al value help gen�rico
			this._openValueHelp('ENTREGA', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RecepcionTrasladosSinHU/Datos/Entrega", oObject.key);
				that.onSubmit_Entrega_RecepcionTrasladosSinHU("", oObject.key);
			});

		},

		/* Valida que la cantidad pickeada de cada posici�n coincida con la requerida */
		onValidaciones_RecepcionTrasladosSinHU: function() {
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/RecepcionTrasladosSinHU/Datos");

			// validar que haya pickeado todas las ump de todas las posiciones y que la cantidad coincida con el total
			var bFaltaPickearPosicion = false;
			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				if (oPos.Pikmg < parseFloat(oPos.Lfimg)) {
					bFaltaPickearPosicion = true;
				}
			}

			if (!oData.Entrega || bFaltaPickearPosicion) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/RecepcionTrasladosSinHU/Validado", bValidado);

			return bValidado;
		},

		/* Submit de input de entrega, carga lista de posiciones */
		onSubmit_Entrega_RecepcionTrasladosSinHU: function(oEvent, oEntrega) {
			var entrega;
			if (oEvent) {
				entrega = oEvent.getParameter("value");
			} else {
				entrega = oEntrega;
			}

			var oAppModel = this.getView().getModel("appModel");

			// Obtener la cabecera y posiciones de la entrega
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, entrega));
			var that = this;
			this.getView().getModel().read("/DELI_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var oListaPosiciones = {};
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];

						// cabecera de la entrega
						oAppModel.setProperty("/RecepcionTrasladosSinHU/Datos/Vstel", item.Vstel);
						oAppModel.setProperty("/RecepcionTrasladosSinHU/Datos/Lfdat", item.Lfdat);
						oAppModel.setProperty("/RecepcionTrasladosSinHU/Datos/Werks", item.WerksSum);
						oAppModel.setProperty("/RecepcionTrasladosSinHU/Datos/Lifex", item.Lifex);

						// cabecera, posiciones y UMp vienen todas juntas, descomprimir: 
						if (!oListaPosiciones[item.Posnr]) {
							// agregar nueva posicion
							oListaPosiciones[item.Posnr] = {
								Posnr: item.Posnr,
								Werks: item.Werks,
								Lgort: item.Lgort,
								Matnr: item.Matnr,
								Arktx: item.Arktx,
								Lfimg: item.Lfimg,
								Meins: item.Meins,
								Charg: item.Charg,
								Pikmg: item.Pikmg
							};
						}

					}
					oAppModel.setProperty("/RecepcionTrasladosSinHU/Datos/ListaPosiciones", oListaPosiciones);
					that.onValidaciones_RecepcionTrasladosSinHU();
				},
				error: function() {
					// limpiar los datos de la entrega
					this._onLimpiarPantalla(null, "RecepcionTrasladosSinHU");
					MessageBox.error("No se encontr� informaci�n para la entrega elegida");
				}.bind(this)
			})
		},

		/* Acci�n principal de la operaci�n RecepcionTrasladosSinHU (Grabar) */
		onAccionPrincipal_RecepcionTrasladosSinHU: function() {
			// Create con lo que haya cargado en appModel>/RecepcionTrasladosSinHU/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/RecepcionTrasladosSinHU/Datos");

			if (!this.onValidaciones_RecepcionTrasladosSinHU()) {
				return;
			}

			var oRequest = {
				Vbeln: oData.Entrega,
				InDeliGmCont_To_IntDeliContNav: []
			};

			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				oRequest.InDeliGmCont_To_IntDeliContNav.push({
					Vbeln: oData.Entrega,
					Posnr: oPos.Posnr,
					Pikmg: oPos.Lfimg
				})
			}
			var that = this;
			this.getView().getModel().create("/IN_DELI_GM_CONTSet", oRequest, {
				success: function(oData, oResponse) {

					//  TODO procesar resultados
					var aMessages = [];
					var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
					// no se sabe que es oSapMessage, pasar siempre a array
					if (Array.isArray(oSapMessage)) {
						aMessages = oSapMessage;
					} else {
						// no es array
						aMessages.push(oSapMessage);
					}

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in aMessages) {
						var item = aMessages[index];
						if (item.severity !== "success") {
							bError = true;
						}
					}

					that._addHeaderMessages(aMessages, "RecepcionTrasladosSinHU");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("RecepcionTrasladosSinHU_success"));

						// // limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "RecepcionTrasladosSinHU");
					}
					that._openMessagePopover();

				},
				error: that._errorOdata
			})
		},

		/********************  Fin RecepcionTrasladosSinHU *****************************************************************************/

		/********************  Inicio RecepcionTrasladosConHU *****************************************************************************/
		/* Value help de centro */
		onValueHelp_RecepcionTrasladosConHU_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RecepcionTrasladosConHU/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/Centro", oObject.key);
				oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/CentroDescripcion", oObject.descripcion);

				// disparar validaciones
				//that.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada();
			});

		},

		/* Value help de entrega */
		// onValueHelp_RecepcionTrasladosConHU_Entrega: function (oEvent) {
		//  var aFilters = [];
		//  var oAppModel = this.getView().getModel("appModel");
		//  var oData = oAppModel.getProperty("/RecepcionTrasladosConHU/Datos");
		//  var that = this;
		//  var sCentro = oData.Centro;

		//  aFilters.push(new Filter({
		//    path: 'Werks',
		//    operator: FilterOperator.EQ,
		//    value1: sCentro // Centro
		//  }));

		//  aFilters.push(new Filter({
		//    path: 'Type',
		//    operator: FilterOperator.EQ,
		//    value1: 'H' // entrega recepci�n
		//  }));
		//  // llamar al value help gen�rico
		//  this._openValueHelp('ENTREGA', aFilters, function (oObject) {
		//    // en oObject viene un objeto con {key: xxx, descripcion: xxx}
		//    oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/Entrega", oObject.key);
		//    that.onSubmit_Entrega_RecepcionTrasladosConHU("", oObject.key);
		//  });

		// },
		onValueHelp_RecepcionTrasladosConHU_Entrega: async function(oEvent) {
			try {
				var oServicioOdata = this.getOwnerComponent().getModel();
				var aFilters = [];
				var oAppModel = this.getView().getModel("appModel");
				var oData = oAppModel.getProperty("/RecepcionTrasladosConHU/Datos");
				var that = this;

				aFilters.push(new Filter({
					path: 'Type',
					operator: FilterOperator.EQ,
					value1: 'H' // entrega recepci�n
				}));

				aFilters.push(new Filter({
					path: 'Werks',
					operator: FilterOperator.EQ,
					value1: oData.Centro // centro
				}));

				var sValueHelpId = "ENTREGA_RECEP_TRASLADOS";
				var fnCallback = (function(oObject) {
					// en oObject viene un objeto con {key: xxx, descripcion: xxx}
					oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/Entrega", oObject.key);
					that.onSubmit_Entrega_RecepcionTrasladosConHU("", oObject.key);
				});

				var oData = this.getView().getModel("valuehelpModel").getData();
				var oConfig = oData[sValueHelpId];
				if (!oConfig) {
					return;
				}

				this.getView().setBusy(true);
				var sUrl = '/' + oConfig.EntitySet;
				var oResponse = await new Promise(resolve => {
					oServicioOdata.read(sUrl, {
						filters: aFilters,
						"success": function(response, header) {
							resolve(response.results);
						},
						"error": function(response) {
							resolve([]);
						}
					});
				});

				//Formateamos los campos y creamos nuevos
				try {
					oResponse.forEach(e => {
						var sNombreDestinatario = e.LifnrName;
						var sCodigoDestinatario = e.Lifnr;
						var sDestinatarioCompleto = `${sNombreDestinatario} (${sCodigoDestinatario})`;
						var sFechaFormateada = this.formatter.formatDate(e.Lfdat);

						e.FechaFormateada = sFechaFormateada;
						e.DestinatarioCompleto = sDestinatarioCompleto;
					});
				} catch (_error) {
					console.log("Error al formatear campos de ayuda de b�squeda de entrega");
					this.getView().setBusy(false);
				}

				var oModelAyudaBusqueda = new JSONModel(oResponse);

				// destruirlo si ya exist�a
				if (this._oValueHelpDialog) {
					this._oValueHelpDialog.destroy();
				}

				this._oValueHelpDialog = sap.ui.xmlfragment(oConfig.Fragment, this);
				this.getView().addDependent(this._oValueHelpDialog);
				var oFilterBar = this._oValueHelpDialog.getFilterBar();
				oFilterBar.setFilterBarExpanded(true);

				this.oColModel = new JSONModel({
					cols: oConfig.Columns
				});

				this._oValueHelpDialog.getTableAsync().then(function(oTable) {
					oTable.setModel(oModelAyudaBusqueda);
					oTable.setModel(this.oColModel, "columns");

					if (oTable.bindRows) oTable.bindAggregation("rows", "/");

					if (oTable.bindItems) {
						oTable.bindAggregation("items", "/", function() {
							return new ColumnListItem({
								cells: oConfig.Columns.map(function(column) {
									return new new Label({
										text: "{" + column.template + "}"
									});
								})
							});
						});
					}

					this._oValueHelpDialog.update();
				}.bind(this));

				// bindearlo a la configuraci�n seleccionada
				this._oValueHelpDialog.bindElement("valuehelpModel>/" + sValueHelpId);

				// setearle la funcion de callback para que la llame cuando el usuario seleccione algo en onValueHelpOkPress
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/Callback", fnCallback);

				// setearle los filtros iniciales
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/aFilters", aFilters || []);

				this.getView().setBusy(false);
				this._oValueHelpDialog.open();
			} catch (error) {
				console.log("Error ayuda b�squeda de entrega");
				MessageToast.show("Error ayuda b�squeda de entrega");
				this.getView().setBusy(false);
			}
		},

		/* Valida que la cantidad pickeada de cada posici�n coincida con la requerida */
		onValidaciones_RecepcionTrasladosConHU: function() {
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/RecepcionTrasladosConHU/Datos");

			// validar que haya pickeado todas las ump de todas las posiciones y que la cantidad coincida con el total
			var bFaltaPickearPosicion = false;
			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				if (oPos.CantPickeada < parseFloat(oPos.Lfimg) || oPos.FaltaPickear) {
					bFaltaPickearPosicion = true;
				}
			}

			if (!oData.Entrega || bFaltaPickearPosicion) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/RecepcionTrasladosConHU/Validado", bValidado);

			return bValidado;
		},

		/* Submit de input de entrega, carga lista de posiciones */
		onSubmit_Entrega_RecepcionTrasladosConHU: function(oEvent, oEntrega) {
			var entrega;
			if (oEvent) {
				entrega = oEvent.getParameter("value");
			} else {
				entrega = oEntrega;
			}

			var oAppModel = this.getView().getModel("appModel");

			// Obtener la cabecera y posiciones de la entrega
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, entrega));
			var that = this;
			this.getView().getModel().read("/DELI_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var oListaPosiciones = {};
					var oListaPosicionesCompleta = [];

					// Ordenar ascendente por PosnrSplit, para que las 900001 queden al final y garantizar que se procesen antes las principales
					oData.results = oData.results.sort((a, b) =>
						a.PosnrSplit > b.PosnrSplit ? 1 : -1
					);

					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];
						// cabecera de la entrega
						oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/Vstel", item.Vstel);
						oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/Lfdat", item.Lfdat);
						oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/Werks", item.WerksSum);
						oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/Lifex", item.Lifex);

						// Lista de posiciones completa, se env�a al guardar
						oListaPosicionesCompleta.push({
							Posnr: item.Posnr,
							Pikmg: item.Lfimg,
							Vbeln: entrega
						});

						/*  Cabecera, posiciones y UMp vienen todas juntas en la misma linea 
						  PosnrSplit indica la posici�n principal, para los casos de particiones de lote
						*/

						if (parseInt(item.PosnrSplit) === 0) {
							// Es posicion principal de la entrega

							if (!oListaPosiciones[item.Posnr]) {
								// agregar nueva posicion
								oListaPosiciones[item.Posnr] = {
									Posnr: item.Posnr,
									Werks: item.Werks,
									Matnr: item.Matnr,
									Arktx: item.Arktx,
									Lfimg: item.Lfimg,
									Meins: item.Meins,
									Charg: item.Charg,
									Pikmg: item.Pikmg,
									Kostk: item.Kostk, // indicador contabilizada, C= contabilizada
									CantPickeada: 0,
									FaltaPickear: true,
									ListaUMp: {},
									PesosVisible: false
								};
							}

							// agregar la UMp a la lista de UMp de la posici�n (si tiene)
							if (item.Exidv) {
								oListaPosiciones[item.Posnr].ListaUMp[item.Exidv] = {
									Venum: item.Venum,
									Matnr: item.Matnr,
									Arktx: item.Arktx,
									Vepos: item.Vepos,
									Vemng: item.Vemng,
									Exidv: item.Exidv,
									Lfimg: item.Lfimg,
									Charg: item.Charg,
									Lgort: item.Lgort,
									Vrkme: item.Vrkme,
									Pickeado: false, // esto se va actualizando a medida que pickea cosas
									PesosVisible: false
								}
							}
						} else {

							// marcar que la posicion principal tiene particion de lotes
							oListaPosiciones[item.PosnrSplit].TieneSplit = true;

							if (!oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv]) {

								oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv] = {
									Venum: item.Venum,
									Matnr: item.Matnr,
									Arktx: item.Arktx,
									Vepos: item.Vepos,
									Vemng: parseFloat(item.Vemng),
									Exidv: item.Exidv,
									Lfimg: item.Lfimg,
									Charg: item.Charg,
									Lgort: item.Lgort,
									Vrkme: item.Vrkme,
									ListaUMp: [], // ESTO TAMBIEN PUEDE TENER UMP CON MISMO EXIDV Y DISTINTO LOTE ENTONCES LAS METEMOS AC� PARA PODER ENVIARLAS AL GRABAR
									Pickeado: false, // esto se va actualizando a medida que pickea cosas
									PesosVisible: false,
									PosParticionLotes: item // ac� se guarda la posici�n de partici�n de lotes completa (90001, etc)
								}
							} else {
								// referido a lo que est� en mayusculas arriba
								oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv].ListaUMp.push({
									Venum: item.Venum,
									Matnr: item.Matnr,
									Arktx: item.Arktx,
									Vepos: item.Vepos,
									Vemng: item.Vemng,
									Exidv: item.Exidv,
									Lfimg: item.Lfimg,
									Charg: item.Charg,
									Lgort: item.Lgort,
									Vrkme: item.Vrkme,
									PesosVisible: false
								});
								// sacarle el lote al padre y sumar la cantidad
								oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv].Charg = "";
								oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv].Vemng += parseFloat(item.Vemng);

							}
						}

					}
					oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/ListaPosiciones", oListaPosiciones);
					oAppModel.setProperty("/RecepcionTrasladosConHU/Datos/ListaPosicionesCompleta", oListaPosicionesCompleta);
					that.onValidaciones_RecepcionTrasladosConHU();

				},
				error: function() {
					// limpiar los datos de la entrega
					this._onLimpiarPantalla(null, "RecepcionTrasladosConHU");
					MessageBox.error("No se encontr� informaci�n para la entrega elegida");
				}.bind(this)
			})
		},

		/* Mostrar popup de pickeo con las HU de una posici�n */
		onVerUHs_UMp_RecepcionTrasladosConHU: function(oEvent) {
			// tomar las UMp de la posici�n
			var sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			// Abrir popup de pickeo

			this._popupPickeo(sPathPosicion, this.onValidaciones_RecepcionTrasladosConHU.bind(this));
		},

		/* Acci�n principal de la operaci�n RecepcionTrasladosConHU (Grabar) */
		onAccionPrincipal_RecepcionTrasladosConHU: function() {
			// Create con lo que haya cargado en appModel>/RecepcionTrasladosConHU/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/RecepcionTrasladosConHU/Datos");

			if (!this.onValidaciones_RecepcionTrasladosConHU()) {
				return;
			}

			// var oRequest = {
			//  Vbeln: oData.Entrega,
			//  OutDeliGmCont_To_OutDeliContNav: [], // Vbeln, Posnr, Lgort, Charg, Pikmg
			//  OutDeliGmCont_To_OutDeliContHuNav: [], // Lgort, Vbeln, Charg, Posnr, Exidv, Vemng, Vemeh
			//  Cont: oData.Contabilizar ? "X" : "" // switch de contabilizar entrega
			// };

			// for (var i in oData.ListaPosiciones) {
			//  var oPos = oData.ListaPosiciones[i];

			//  // posiciones
			//  oRequest.OutDeliGmCont_To_OutDeliContNav.push({
			//    Vbeln: oData.Entrega,
			//    Posnr: oPos.Posnr,
			//    Pikmg: oPos.Lfimg,
			//  });

			//  // HU
			//  for (var j in oPos.ListaUMp) {
			//    var oUMp = oPos.ListaUMp[j];
			//    if (oUMp.Pickeado) {
			//      oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
			//        Vbeln: oData.Entrega,
			//        Posnr: oPos.Posnr,
			//        Lgort: oUMp.Lgort,
			//        Charg: oUMp.Charg,
			//        Exidv: oUMp.Exidv,
			//        Vemng: oUMp.Vemng,
			//        Vemeh: oUMp.Vrkme
			//      });
			//    }
			//  }

			// }

			var oRequest = {
				Vbeln: oData.Entrega,
				InDeliGmContHu_To_IntDeliContNav: oData.ListaPosicionesCompleta
			};

			// var oPosSplit = {}; // para ir agrupando las posiciones de split

			// for (var i in oData.ListaPosiciones) {
			//  var oPos = oData.ListaPosiciones[i];

			//  oRequest.InDeliGmContHu_To_IntDeliContNav.push({
			//    Vbeln: oData.Entrega,
			//    Posnr: oPos.Posnr,
			//    Pikmg: oPos.Lfimg
			//  });
			// }

			// for (var i in oPosSplit) {
			//  oRequest.InDeliGmContHu_To_IntDeliContNav.push(oPosSplit[i]);
			// }

			var that = this;
			this.getView().getModel().create("/IN_DELI_GM_CONT_HUSet", oRequest, {
				success: function(oData, oResponse) {

					//  TODO procesar resultados
					var aMessages = [];
					var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
					// no se sabe que es oSapMessage, pasar siempre a array
					if (Array.isArray(oSapMessage)) {
						aMessages = oSapMessage;
					} else {
						// no es array
						aMessages.push(oSapMessage);
					}

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in aMessages) {
						var item = aMessages[index];
						if (item.severity !== "success") {
							bError = true;
						}
					}

					that._addHeaderMessages(aMessages, "RecepcionTrasladosConHU");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("RecepcionTrasladosConHU_success"));

						// // limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "RecepcionTrasladosConHU");
					}
					that._openMessagePopover();

				},
				error: that._errorOdata
			})
		},

		/********************  Fin RecepcionTrasladosConHU *****************************************************************************/

		/********************  Inicio TrasladoEntreCentrosPickingEntregaSalida *****************************************************************************/
		//Centro
		onValueHelp_TrasladoEntreCentrosPickingEntregaSalida_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/Centro", oObject.key);
				oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/CentroDescripcion", oObject.descripcion);

			});

		},
		//Ruta
		onValueHelp_TrasladoEntreCentrosPickingEntregaSalida_Ruta: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos");
			var that = this;
			this._openValueHelp('RUTA', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/Ruta", oObject.key);
				oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/RutaDescripcion", oObject.descripcion);

			});

		},
		/* Value help de entrega */
		// onValueHelp_TrasladoEntreCentrosPickingEntregaSalida_Entrega: function (oEvent) {
		//  var aFilters = [];
		//  var oAppModel = this.getView().getModel("appModel");
		//  var oData = oAppModel.getProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos");
		//  var that = this;
		//  aFilters.push(new Filter({
		//    path: 'Werks',
		//    operator: FilterOperator.EQ,
		//    value1: oData.Centro
		//  }));

		//  aFilters.push(new Filter({
		//    path: 'Type',
		//    operator: FilterOperator.EQ,
		//    value1: 'T' // entrega salida
		//  }));
		//  // llamar al value help gen�rico
		//  this._openValueHelp('ENTREGA', aFilters, function (oObject) {
		//    // en oObject viene un objeto con {key: xxx, descripcion: xxx}
		//    oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/Entrega", oObject.key);
		//    that.onSubmit_Entrega_TrasladoEntreCentrosPickingEntregaSalida("", oObject.key);
		//  });

		// },

		onValueHelp_TrasladoEntreCentrosPickingEntregaSalida_Entrega: async function(oEvent) {
			try {
				var oServicioOdata = this.getOwnerComponent().getModel();
				var aFilters = [];
				var oAppModel = this.getView().getModel("appModel");
				var oData = oAppModel.getProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos");
				var that = this;

				aFilters.push(new Filter({
					path: 'Type',
					operator: FilterOperator.EQ,
					value1: 'T' // entrega recepci�n
				}));

				aFilters.push(new Filter({
					path: 'Werks',
					operator: FilterOperator.EQ,
					value1: oData.Centro // centro
				}));

				var sValueHelpId = "ENTREGA_PICKING_ENT_SALIDA_VTAS";
				var fnCallback = (function(oObject) {
					// en oObject viene un objeto con {key: xxx, descripcion: xxx}
					oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/Entrega", oObject.key);
					that.onSubmit_Entrega_TrasladoEntreCentrosPickingEntregaSalida("", oObject.key);
				});

				var oData = this.getView().getModel("valuehelpModel").getData();
				var oConfig = oData[sValueHelpId];
				if (!oConfig) {
					return;
				}

				this.getView().setBusy(true);
				var sUrl = '/' + oConfig.EntitySet;
				var oResponse = await new Promise(resolve => {
					oServicioOdata.read(sUrl, {
						filters: aFilters,
						"success": function(response, header) {
							resolve(response.results);
						},
						"error": function(response) {
							resolve([]);
						}
					});
				});

				//Formateamos los campos y creamos nuevos
				try {
					oResponse.forEach(e => {
						var sNombreDestinatario = e.KunnrName;
						var sCodigoDestinatario = e.Kunnr;
						var sDestinatarioCompleto = `${sNombreDestinatario} (${sCodigoDestinatario})`;
						var sFechaFormateada = this.formatter.formatDate(e.Wadat);

						e.FechaFormateada = sFechaFormateada;
						e.DestinatarioCompleto = sDestinatarioCompleto;
					});
				} catch (_error) {
					console.log("Error al formatear campos de ayuda de b�squeda de entrega");
					this.getView().setBusy(false);
				}

				var oModelAyudaBusqueda = new JSONModel(oResponse);

				// destruirlo si ya exist�a
				if (this._oValueHelpDialog) {
					this._oValueHelpDialog.destroy();
				}

				this._oValueHelpDialog = sap.ui.xmlfragment(oConfig.Fragment, this);
				this.getView().addDependent(this._oValueHelpDialog);
				var oFilterBar = this._oValueHelpDialog.getFilterBar();
				oFilterBar.setFilterBarExpanded(true);

				this.oColModel = new JSONModel({
					cols: oConfig.Columns
				});

				this._oValueHelpDialog.getTableAsync().then(function(oTable) {
					oTable.setModel(oModelAyudaBusqueda);
					oTable.setModel(this.oColModel, "columns");

					if (oTable.bindRows) oTable.bindAggregation("rows", "/");

					if (oTable.bindItems) {
						oTable.bindAggregation("items", "/", function() {
							return new ColumnListItem({
								cells: oConfig.Columns.map(function(column) {
									return new new Label({
										text: "{" + column.template + "}"
									});
								})
							});
						});
					}

					this._oValueHelpDialog.update();
				}.bind(this));

				// bindearlo a la configuraci�n seleccionada
				this._oValueHelpDialog.bindElement("valuehelpModel>/" + sValueHelpId);

				// setearle la funcion de callback para que la llame cuando el usuario seleccione algo en onValueHelpOkPress
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/Callback", fnCallback);

				// setearle los filtros iniciales
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/aFilters", aFilters || []);

				this.getView().setBusy(false);
				this._oValueHelpDialog.open();
			} catch (error) {
				console.log("Error ayuda b�squeda de entrega");
				MessageToast.show("Error ayuda b�squeda de entrega");
				this.getView().setBusy(false);
			}
		},

		/* Valida que la cantidad pickeada de cada posici�n coincida con la requerida */
		onValidaciones_TrasladoEntreCentrosPickingEntregaSalida: function() {
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos");

			// validar que haya pickeado todas las ump de todas las posiciones y que la cantidad coincida con el total
			var bFaltaPickearPosicion = false;
			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				if (oPos.Kostk !== "C") {
					if (oPos.CantPickeada < parseFloat(oPos.Lfimg) || oPos.FaltaPickear) {
						bFaltaPickearPosicion = true;
					}
				}

			}

			if (!oData.Entrega || bFaltaPickearPosicion) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Validado", bValidado);

			return bValidado;
		},

		/* Submit de input de entrega, carga lista de posiciones */
		onSubmit_Entrega_TrasladoEntreCentrosPickingEntregaSalida: function(oEvent, oEntrega) {
			var entrega;
			if (oEvent) {
				entrega = oEvent.getParameter("value");
			} else {
				entrega = oEntrega;
			}

			var oAppModel = this.getView().getModel("appModel");

			// Obtener la cabecera y posiciones de la entrega
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, entrega));
			var that = this;
			this.getView().getModel().read("/DELI_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var oListaPosiciones = {};
					var oListaPosicionesCompleta = [];

					// Ordenar ascendente por PosnrSplit, para que las 900001 queden al final y garantizar que se procesen antes las principales
					oData.results = oData.results.sort((a, b) =>
						a.PosnrSplit > b.PosnrSplit ? 1 : -1
					);

					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];

						// Lista de posiciones completa, se env�a al guardar
						oListaPosicionesCompleta.push({
							Posnr: item.Posnr,
							Pikmg: item.Lfimg,
							Vbeln: entrega
						});

						/*  Cabecera, posiciones y UMp vienen todas juntas en la misma linea 
						  PosnrSplit indica la posici�n principal, para los casos de particiones de lote
						*/

						oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/Vstel", item.Vstel);
						oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/Lfdat", item.Lfdat);
						// oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Werks", item.WerksSum);
						// oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Lifex", item.Lifex);
						oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/KunnrName", item.KunnrName);

						if (parseInt(item.PosnrSplit) === 0) {
							// Es posicion principal de la entrega

							if (!oListaPosiciones[item.Posnr]) {
								// agregar nueva posicion
								oListaPosiciones[item.Posnr] = {
									Posnr: item.Posnr,
									Werks: item.Werks,
									Matnr: item.Matnr,
									Arktx: item.Arktx,
									Lfimg: item.Lfimg,
									Meins: item.Meins,
									Charg: item.Charg,
									Pikmg: item.Pikmg,
									Kostk: item.Kostk, // indicador contabilizada, C= contabilizada
									CantPickeada: 0,
									FaltaPickear: true,
									ListaUMp: {},
									PesosVisible: false
								};
							}

							// agregar la UMp a la lista de UMp de la posici�n (si tiene)
							// if (item.Exidv) {
							//  oListaPosiciones[item.Posnr].ListaUMp[item.Exidv] = {
							//    Venum: item.Venum,
							//    Matnr: item.Matnr,
							//    Arktx: item.Arktx,
							//    Vepos: item.Vepos,
							//    Vemng: item.Vemng,
							//    Exidv: item.Exidv,
							//    Lfimg: item.Lfimg,
							//    Charg: item.Charg,
							//    Lgort: item.Lgort,
							//    Vrkme: item.Vrkme,
							//    Pickeado: false, // esto se va actualizando a medida que pickea cosas
							//  }
							// }
							if (item.Exidv) {
								if (!oListaPosiciones[item.Posnr].ListaUMp[item.Exidv]) {

									oListaPosiciones[item.Posnr].ListaUMp[item.Exidv] = {
										Venum: item.Venum,
										Matnr: item.Matnr,
										Arktx: item.Arktx,
										Vepos: item.Vepos,
										Vemng: parseFloat(item.Vemng),
										Exidv: item.Exidv,
										Lfimg: item.Lfimg,
										Charg: item.Charg,
										Lgort: item.Lgort,
										Vrkme: item.Vrkme,
										ListaUMp: [], // ESTA TAMBIEN PUEDE TENER UMP CON MISMO EXIDV Y DISTINTO LOTE ENTONCES LAS METEMOS AC� PARA PODER ENVIARLAS AL GRABAR
										Pickeado: false, // esto se va actualizando a medida que pickea cosas
										PesosVisible: false
									}
								} else {
									// referido a lo que est� en mayusculas arriba
									oListaPosiciones[item.Posnr].ListaUMp[item.Exidv].ListaUMp[item.Posnr] = {
										Venum: item.Venum,
										Matnr: item.Matnr,
										Arktx: item.Arktx,
										Vepos: item.Vepos,
										Vemng: parseFloat(item.Vemng),
										Exidv: item.Exidv,
										Lfimg: item.Lfimg,
										Charg: item.Charg,
										Lgort: item.Lgort,
										Vrkme: item.Vrkme,
										PesosVisible: false
									}

									// sacarle el lote al padre y sumar la cantidad
									oListaPosiciones[item.Posnr].ListaUMp[item.Exidv].Charg = "";
									oListaPosiciones[item.Posnr].ListaUMp[item.Exidv].Vemng += parseFloat(item.Vemng);
								}
							}

						} else {
							// Posici�n de particion de lotes, agregar las HU a la posici�n principal accediendo por PosnrSplit
							if (oListaPosiciones[item.PosnrSplit]) {

								// marcar que la posicion principal tiene particion de lotes
								oListaPosiciones[item.PosnrSplit].TieneSplit = true;
								if (item.Exidv) {
									if (!oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv]) {

										oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv] = {
											Venum: item.Venum,
											Matnr: item.Matnr,
											Arktx: item.Arktx,
											Vepos: item.Vepos,
											Vemng: parseFloat(item.Vemng),
											Exidv: item.Exidv,
											Lfimg: item.Lfimg,
											Charg: item.Charg,
											Lgort: item.Lgort,
											Vrkme: item.Vrkme,
											ListaUMp: [], // ESTA TAMBIEN PUEDE TENER UMP CON MISMO EXIDV Y DISTINTO LOTE ENTONCES LAS METEMOS AC� PARA PODER ENVIARLAS AL GRABAR
											Pickeado: false, // esto se va actualizando a medida que pickea cosas
											PosParticionLotes: item, // ac� se guarda la posici�n de partici�n de lotes completa (90001, etc)
											PesosVisible: false
										}
									} else {
										// referido a lo que est� en mayusculas arriba
										oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv].ListaUMp[item.Posnr] = {
												Venum: item.Venum,
												Matnr: item.Matnr,
												Arktx: item.Arktx,
												Vepos: item.Vepos,
												Vemng: parseFloat(item.Vemng),
												Exidv: item.Exidv,
												Lfimg: item.Lfimg,
												Charg: item.Charg,
												Lgort: item.Lgort,
												Vrkme: item.Vrkme,
												PesosVisible: false
											}
											// sacarle el lote al padre y sumar la cantidad
										oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv].Charg = "";
										oListaPosiciones[item.PosnrSplit].ListaUMp[item.Exidv].Vemng += parseFloat(item.Vemng);

									}
								}
							}

						}

					}
					oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/ListaPosiciones", oListaPosiciones);

					oAppModel.setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/ListaPosicionesCompleta", oListaPosicionesCompleta);
					that.onValidaciones_TrasladoEntreCentrosPickingEntregaSalida();
				},
				error: function() {
					// limpiar los datos de la entrega
					this._onLimpiarPantalla(null, "TrasladoEntreCentrosPickingEntregaSalida");
					MessageBox.error("No se encontr� informaci�n para la entrega elegida");
				}.bind(this)
			})
		},

		/* Mostrar popup de pickeo con las HU de una posici�n */
		onVerUHs_UMp_TrasladoEntreCentrosPickingEntregaSalida: function(oEvent) {
			// tomar las UMp de la posici�n
			var sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			// Abrir popup de pickeo
			this._popupPickeo(sPathPosicion, this.onValidaciones_TrasladoEntreCentrosPickingEntregaSalida.bind(this));
		},

		/* Acci�n principal de la operaci�n TrasladoEntreCentrosPickingEntregaSalida (Grabar) */
		onAccionPrincipal_TrasladoEntreCentrosPickingEntregaSalida: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreCentrosPickingEntregaSalida/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos");

			if (!this.onValidaciones_TrasladoEntreCentrosPickingEntregaSalida()) {
				return;
			}

			var oRequest = {
				Vbeln: oData.Entrega,
				OutDeliGmCont_To_OutDeliContNav: [], // Vbeln, Posnr, Lgort, Charg, Pikmg
				OutDeliGmCont_To_OutDeliContHuNav: [], // Lgort, Vbeln, Charg, Posnr, Exidv, Vemng, Vemeh
				Cont: oData.Contabilizar ? "X" : "", // switch de contabilizar entrega
				Route: oData.Ruta
			};

			if (!oData.Contabilizar) {

				for (var i in oData.ListaPosiciones) {
					var oPos = oData.ListaPosiciones[i];

					/* Contar las HU pickeadas para esta posicion: 
					  si es 1, se mandan los datos de lote en la posic�n,
					  si >1, se mandan en estructura aparte
					*/
					var cantUmpPickeadas = 0;
					var oUMpPickeada;
					for (var j in oPos.ListaUMp) {
						var oUMp = oPos.ListaUMp[j];
						if (oUMp.Pickeado) {
							cantUmpPickeadas++;
							oUMpPickeada = oUMp;
						}
					}

					// HU
					if (cantUmpPickeadas > 1) {
						// posicion
						oRequest.OutDeliGmCont_To_OutDeliContNav.push({
							Vbeln: oData.Entrega,
							Posnr: oPos.Posnr,
							Pikmg: oPos.Lfimg,
						});
						// >1 HU, cargar estructura aparte
						for (var j in oPos.ListaUMp) {
							var oUMp = oPos.ListaUMp[j];
							if (oUMp.Pickeado) {
								oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
									Vbeln: oData.Entrega,
									Posnr: oPos.Posnr,
									// Lgort: oUMp.Lgort,
									Charg: oUMp.Charg,
									Exidv: oUMp.Exidv,
									Vemng: oUMp.Vemng.toString(),
									Vemeh: oUMp.Vrkme
								});
							}
						}
					} else {
						// 1 HU, cargar en la posicion
						var oNewPos = {
							Vbeln: oData.Entrega,
							Posnr: oPos.Posnr,
							Pikmg: oPos.Lfimg,
						};

						// SI ESTA POSICION UNICA TIENE PARTICION DE LOTES, NO SE CUMPLE LA LOGICA DE ARRIBA Y HAY QUE MANDARLOS POR SEPARADO, POR MAS QUE HAYA PICKEADO SOLO 1 HU QUE EN REALIDAD SON VARIAS CON DISTINTOS LOTES Y MISMO EXIDV
						if (oUMpPickeada.ListaUMp.length > 0) {
							for (var j in oUMpPickeada.ListaUMp) {
								var oUMp = oUMpPickeada.ListaUMp[j];
								oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
									Vbeln: oData.Entrega,
									Posnr: oPos.Posnr,
									Charg: oUMp.Charg,
									Exidv: oUMp.Exidv,
									Vemng: oUMp.Vemng.toString(),
									Vemeh: oUMp.Vrkme
								});
							}
							// y ademas agregar la HU "padre", que no es padre, es la que apareci� primero y le encajamos el resto adentro para que funcione esta logica
							oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
								Vbeln: oData.Entrega,
								Posnr: oNewPos.Posnr,
								Charg: oUMpPickeada.Charg,
								Exidv: oUMpPickeada.Exidv,
								Vemng: oUMpPickeada.Vemng.toString(),
								Vemeh: oUMpPickeada.Vrkme
							});

						} else {
							// caso donde realmente es solo 1 HU y 1 Pos
							oPos.Charg = oUMpPickeada.Charg;
							oPos.Lgort = oUMpPickeada.Lgort;
						}
						oRequest.OutDeliGmCont_To_OutDeliContNav.push(oNewPos);
					}
				}
			}

			var that = this;
			this.getView().getModel().create("/OUT_DELI_GM_CONTSet", oRequest, {
				success: function(oData, oResponse) {

					// procesar resultados
					var aMessages = [];
					var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
					// no se sabe que es oSapMessage, pasar siempre a array
					if (Array.isArray(oSapMessage)) {
						aMessages = oSapMessage;
					} else {
						// no es array
						aMessages.push(oSapMessage);
					}

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in aMessages) {
						var item = aMessages[index];
						if (item.severity !== "success") {
							bError = true;
						}
					}

					that._addHeaderMessages(aMessages, "TrasladoEntreCentrosPickingEntregaSalida");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreCentrosPickingEntregaSalida_success"));

						if (oRequest.Cont) {
							// limpiar los datos de este objeto del modelo, solo despu�s de contabilizar, no en pasos intermedios
							that._onLimpiarPantalla(null, "TrasladoEntreCentrosPickingEntregaSalida");
						} else {
							// // poner kostk = C para que la tome como contabilizada en cada posicion
							var aListaPosiciones = that.getView().getModel("appModel").getProperty(
								"/TrasladoEntreCentrosPickingEntregaSalida/Datos/ListaPosiciones");
							for (var i in aListaPosiciones) {
								aListaPosiciones[i].Kostk = "C";
							}
							that.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosPickingEntregaSalida/Datos/ListaPosiciones",
								aListaPosiciones);
						}
					}
					that._openMessagePopover();

				},
				error: that._errorOdata
			})
		},

		/********************  Fin TrasladoEntreCentrosPickingEntregaSalida *****************************************************************************/

		/********************  Inicio InventariosSinUmp *****************************************************************************/
		// Centro
		onValueHelp_InventariosSinUmp_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/InventariosSinUmp/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/InventariosSinUmp/Datos/Centro", oObject.key);
				oAppModel.setProperty("/InventariosSinUmp/Datos/CentroDescripcion", oObject.descripcion);

			});

		},
		/* Value help de doc. inventario */
		onValueHelp_InventariosSinUmp_Inventario: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/InventariosSinUmp/Datos");
			var that = this;
			aFilters.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, oData.Centro));

			// llamar al value help gen�rico
			this._openValueHelp('INVENTARIO_SIN_UMP', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/InventariosSinUmp/Datos/DocInventario", oObject.key);
				that.onSubmit_InventariosSinUmp_Inventario("", oObject.key);
				// disparar validaciones
				that.onValidaciones_InventariosSinUmp();
			});

		},

		/* Validaciones de la operaci�n InventariosSinUmp */
		onValidaciones_InventariosSinUmp: function() {
			// Validar que los datos de appModel>/InventariosSinUmp/Datos est�n cargados
			//  y setear appModel>/InventariosSinUmp/Validado = true

			var bValidado = true;
			//var bFaltaPickearPosicion = false;
			var oData = this.getView().getModel("appModel").getProperty("/InventariosSinUmp/Datos");

			// validar que haya pickeado todas las ump de todas las posiciones y que la cantidad coincida con el total
			/*for (var i in oData.ListaPosiciones) {
			  var oPos = oData.ListaPosiciones[i];
			  if (!parseFloat(oPos.Pikmg)) {
			    bFaltaPickearPosicion = true;
			  }
			}*/

			if (!oData.DocInventario) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/InventariosSinUmp/Validado", bValidado);

			return bValidado;
		},

		/* Submit de input de doc. inventario, carga lista de posiciones */
		onSubmit_InventariosSinUmp_Inventario: function(oEvent, oDocInventario, oCentro) {
			var sDocInventario;
			var oData = this.getView().getModel("appModel").getProperty("/InventariosSinUmp/Datos");

			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;
			if (oEvent) {
				sDocInventario = oEvent.getParameter("value");
			} else {
				sDocInventario = oDocInventario;
			}

			var oAppModel = this.getView().getModel("appModel");

			// Obtener la cabecera y posiciones del doc inventario
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Iblnr", sap.ui.model.FilterOperator.EQ, sDocInventario));
			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, centroUsuario));
			this.getView().getModel().read("/INV_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var oListaPosiciones = {};
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];

						// cabecera del doc. inventario
						oAppModel.setProperty("/InventariosSinUmp/Datos/Almacen", item.Lgort);
						oAppModel.setProperty("/InventariosSinUmp/Datos/Centro", item.Werks);

						// cabecera, posiciones y UMp vienen todas juntas, descomprimir: 
						if (!oListaPosiciones[item.Zeili]) {
							// agregar nueva posicion
							oListaPosiciones[item.Zeili] = {
								Iblnr: item.Iblnr,
								Gjahr: item.Gjahr,
								Zldat: item.Zldat,
								Zeili: item.Zeili,
								Matnr: item.Matnr,
								Werks: item.Werks,
								Lgort: item.Lgort,
								Charg: item.Charg,
								Menge: item.Menge,
								Meins: item.Meins,
								Xnull: item.Xnull,
								Pikmg: 0
							};
						}
					}
					oAppModel.setProperty("/InventariosSinUmp/Datos/ListaPosiciones", oListaPosiciones);
				},
				error: function() {
					// limpiar los datos del inventario
					that._onLimpiarPantalla(null, "InventariosSinUmp");
					MessageBox.error("No se encontr� informaci�n para el doc. inventario elegido");
				}.bind(this)
			})
		},

		/* Acci�n principal de la operaci�n InventariosSinUmp (contabilizar) */
		onAccionPrincipal_InventariosSinUmp: function() {
			// Create con lo que haya cargado en appModel>/InventariosSinUmp/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/InventariosSinUmp/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			if (!this.onValidaciones_InventariosSinUmp()) {
				return;
			}

			var oRequest = {
				IvIblnr: oData.DocInventario,
				IvCommit: "X",
				InvCount_To_ItemsNav: [],
				InvCount_To_Bapiret2Nav: []
			}

			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				oRequest.InvCount_To_ItemsNav.push({
					Iblnr: oData.DocInventario,
					Gjahr: oPos.Gjahr,
					Zldat: oPos.Zldat,
					Zeili: oPos.Zeili,
					Matnr: oPos.Matnr,
					Werks: oPos.Werks,
					Lgort: oPos.Lgort,
					Charg: oPos.Charg,
					Menge: (oPos.Pikmg) ? oPos.Pikmg : "0",
					Meins: oPos.Meins,
					Xnull: oPos.Xnull
				})
			}

			this.getView().getModel().create("/INV_COUNTSet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.InvCount_To_Bapiret2Nav.results) {
						var item = oResponse.InvCount_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.InvCount_To_Bapiret2Nav.results, "InventariosSinUmp");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("InventariosSinUmp_success"));

						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "InventariosSinUmp");
					}
					that._openMessagePopover();
				},
				error: that._errorOdata
			})
		},

		/********************  Fin InventariosSinUmp *****************************************************************************/

		/********************  Inicio InventariosConUmp *****************************************************************************/
		//Centro
		onValueHelp_InventariosConUmp_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/InventariosConUmp/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/InventariosConUmp/Datos/Centro", oObject.key);
				oAppModel.setProperty("/InventariosConUmp/Datos/CentroDescripcion", oObject.descripcion);

			});

		},
		/* Value help de doc. inventario */
		onValueHelp_InventariosConUmp_Inventario: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/InventariosConUmp/Datos");
			var that = this;
			aFilters.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, oData.Centro));

			// llamar al value help gen�rico
			this._openValueHelp('INVENTARIO_CON_UMP', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/InventariosConUmp/Datos/DocInventario", oObject.key);
				var sAlmacen = oObject.descripcion.split(" ").length > 1 ? oObject.descripcion.split(" ")[0] : "";
				that.onSubmit_InventariosConUmp_Inventario("", oObject.key, sAlmacen);
				// disparar validaciones
				that.onValidaciones_InventariosConUmp();
			});

		},

		/* Validaciones de la operaci�n InventariosConUmp */
		onValidaciones_InventariosConUmp: function() {
			// Validar que los datos de appModel>/InventariosConUmp/Datos est�n cargados
			//  y setear appModel>/InventariosConUmp/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/InventariosConUmp/Datos");

			var sCantPosiciones = (oData.ListaPosiciones) ? oData.ListaPosiciones.length : 0;
			if (sCantPosiciones === 0) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/InventariosConUmp/Validado", bValidado);

			return bValidado;
		},

		/* Submit de input de doc. inventario, carga lista de posiciones */
		onSubmit_InventariosConUmp_Inventario: function(oEvent, oDocInventario, oAlmacen) {
			var sDocInventario;
			var oData = this.getView().getModel("appModel").getProperty("/InventariosConUmp/Datos");

			var sAlmacen = oAlmacen;
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;
			if (oEvent) {
				sDocInventario = oEvent.getParameter("value");
			} else {
				sDocInventario = oDocInventario;
			}

			var oAppModel = this.getView().getModel("appModel");

			// Obtener la cabecera y posiciones del doc inventario
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("HuinvNr", sap.ui.model.FilterOperator.EQ, sDocInventario));
			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, centroUsuario));
			aFilter.push(new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.EQ, sAlmacen));
			this.getView().getModel().read("/INV_HU_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var aListaPosiciones = [];
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];

						// cabecera del doc. inventario
						oAppModel.setProperty("/InventariosConUmp/Datos/Almacen", item.Lgort);
						oAppModel.setProperty("/InventariosConUmp/Datos/Centro", item.Werks);

						aListaPosiciones.push(item);
					}
					oAppModel.setProperty("/InventariosConUmp/Datos/ListaPosiciones", aListaPosiciones);
					that.onValidaciones_InventariosConUmp();
				},
				error: function() {
					// limpiar los datos de la entrega
					that._onLimpiarPantalla(null, "InventariosConUmp");
					MessageBox.error("No se encontr� informaci�n para el doc. inventario elegido");
				}.bind(this)
			})
		},

		/* Acci�n principal de la operaci�n InventariosConUmp (contabilizar) */
		onAccionPrincipal_InventariosConUmp: function() {
			// Create con lo que haya cargado en appModel>/InventariosConUmp/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/InventariosConUmp/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			if (!this.onValidaciones_InventariosConUmp()) {
				return;
			}

			var oRequest = {
				IvInvnr: oData.DocInventario,
				IvWerks: oData.Centro,
				IvLgort: oData.Almacen,
				IvCommit: "X",
				InvCountHu_To_ItemsNav: [],
				InvCountHu_To_Bapiret2Nav: []
			};

			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				oRequest.InvCountHu_To_ItemsNav.push({
					HuinvNr: oData.DocInventario,
					Werks: oData.Centro,
					Lgort: oData.Almacen,
					ItemNr: oPos.ItemNr,
					Exidv: oPos.Exidv,
					TopExidv: oPos.TopExidv,
					Matnr: oPos.Matnr,
					Charg: oPos.Charg,
					Vemng: (oPos.CantContada > 0) ? oPos.CantContada : "0",
					Meins: oPos.Meins,
					Huexist: (oPos.ExisteHU) ? true : false
				})
			}

			this.getView().getModel().create("/INV_COUNT_HUSet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.InvCountHu_To_Bapiret2Nav.results) {
						var item = oResponse.InvCountHu_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.InvCountHu_To_Bapiret2Nav.results, "InventariosConUmp");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("InventariosConUmp_success"));

						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "InventariosConUmp");
					}
					that._openMessagePopover();
				},
				error: that._errorOdata
			})
		},

		/* Mostrar popup de pickeo con las HU de una posici�n */
		onVerUHs_UMp_InventariosConUmp: function(oEvent) {
			// tomar las UMp de la posici�n
			var sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			// Abrir popup de pickeo
			this._popupPickeo(sPathPosicion, this.onValidaciones_InventariosConUmp.bind(this));
		},

		onSubmit_UMp_InventariosConUmp: function(oEvent) {

			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// marcar como "HU Existe" en lista de posiciones
				this.marcarUmp_InventariosConUmp(aUmp[0]);
				// limpiar el input
				oSource.setValue("");
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		marcarUmp_InventariosConUmp: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			var aListaPosiciones = oAppModel.getProperty("/InventariosConUmp/Datos/ListaPosiciones");
			var bMarcada = false;

			for (var i = 0; i < aListaPosiciones.length; i++) {
				if (aListaPosiciones[i].TopExidv === ump.Exidv) {
					// marcar el pallet/caja como 'Existe HU'
					if (aListaPosiciones[i].Exidv) {
						aListaPosiciones[i].ExisteHU = true;
						bMarcada = true;
					}
					// inicializar cantidad
					if (aListaPosiciones[i].Matnr) {
						aListaPosiciones[i].CantContada = aListaPosiciones[i].Vemng;
					}
				}
			}

			oAppModel.setProperty("/InventariosConUmp/Datos/ListaPosiciones", aListaPosiciones);

			if (bMarcada) {
				MessageToast.show(this.oTextos.getText("ump_existe", [ump.Exidv]));
			} else {
				MessageToast.show(this.oTextos.getText("ump_invalida_inventario"));
			}

			// disparar validaciones
			this.onValidaciones_InventariosConUmp();

		},

		/********************  Fin InventariosConUmp *****************************************************************************/

		/********************  Inicio DesembalajeUmp *****************************************************************************/

		/* Acci�n principal de la operaci�n DesembalajeUmp (contabilizar) */
		onAccionPrincipal_DesembalajeUmp: function() {
			// Create con lo que haya cargado en appModel>/DesembalajeUmp/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/DesembalajeUmp/Datos");
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var aPromises = [];

			if (!this.onValidaciones_DesembalajeUmp()) {
				return;
			}

			for (var ump in oData.ListaUMp) {
				var oRequest = {
					Key: ump,
					Exidv: oData.ListaUMp[ump].Exidv,
					HuUnpack_To_DetalleUpkNav: [{
						Exidv: oData.ListaUMp[ump].Exidv,
						Vhilm: oData.ListaUMp[ump].Vhilm,
						ExidvSup: oData.ListaUMp[ump].ExidvSup,
						Venum: oData.ListaUMp[ump].Venum,
						Vepos: oData.ListaUMp[ump].Vepos,
						Vbeln: oData.ListaUMp[ump].Vbeln,
						Posnr: oData.ListaUMp[ump].Posnr,
						Matnr: oData.ListaUMp[ump].Matnr,
						Maktx: oData.ListaUMp[ump].Maktx,
						Charg: oData.ListaUMp[ump].Charg,
						Werks: oData.ListaUMp[ump].Werks,
						Lgort: oData.ListaUMp[ump].Lgort,
						Vemng: oData.ListaUMp[ump].Vemng,
						Vemeh: oData.ListaUMp[ump].Vemeh,
						Brgew: oData.ListaUMp[ump].Brgew,
						Velin: oData.ListaUMp[ump].Velin,
						Wdatu: oData.ListaUMp[ump].Wdatu
					}]
				};
				aPromises.push(that.desembalarContenido(oRequest).catch(function(oError) {
					return {
						Error: oError
					};
				}));
			}

			Promise.all(aPromises).then(that.desembalarContenidoSuccess.bind(that),
				that.desembalarContenidoError.bind(that));

		},

		desembalarContenido: function(oContenido) {
			var that = this;
			var oRequest = {
				Exidv: oContenido.Exidv,
				Full: (this.getView().getModel("appModel").getProperty("/DesembalajeUmp/Datos/DesembalajeCompleto") ? "X" : ""),
				HuUnpack_To_DetalleUpkNav: oContenido.HuUnpack_To_DetalleUpkNav
			}
			return new Promise(function(resolve, reject) {
				that.getView().getModel().create("/HU_UNPACKSet", oRequest, {
					success: function(oData) {
						resolve({
							Key: oContenido.Key,
							Exidv: oContenido.Exidv,
							Resultado: (oData.HuUnpack_To_DetalleUpkNav.results.length > 0) ? oData.HuUnpack_To_DetalleUpkNav.results : []
						});
					},
					error: function(oError) {
						reject(oError);
					}
				})
			});
		},

		desembalarContenidoSuccess: function(aResultados) {
			var oListaUMp = this.getView().getModel("appModel").getProperty("/DesembalajeUmp/Datos/ListaUMp");
			var that = this;
			var bDesembalado = false;

			// recorrer resultados
			for (var i = 0; i < aResultados.length; i++) {

				// error en el desembalaje
				if (aResultados[i].Error) {

					var aMessages = [];
					var oSapMessage = JSON.parse(aResultados[i].Error.responseText);
					// no se sabe que es oSapMessage, pasar siempre a array
					if (Array.isArray(oSapMessage)) {
						aMessages = oSapMessage;
					} else {
						// no es array
						aMessages.push(oSapMessage);
					}

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in aMessages) {
						var item = aMessages[index];
						if (item.severity !== "success") {
							bError = true;
						}
					}

					that._addHeaderMessages(aMessages, "DesembalajeUMp");

					// sin errores, agregar "hijos" a la lista para seguir desembalando
				} else if (aResultados[i].Key) {

					bDesembalado = true;

					// borrar del listado la UMp escandeada
					delete oListaUMp[aResultados[i].Key];
					this.getView().getModel("appModel").setProperty("/DesembalajeUmp/Datos/ListaUMp", oListaUMp);

					var aContenido = aResultados[i].Resultado.filter(function(resultado) {
						return resultado.ExidvSup === aResultados[i].Exidv;
					});

					for (var j = 0; j < aContenido.length; j++) {
						// agregar la ump a la lista
						this.agregarUmp_DesembalajeUmp(aContenido[j]);
					}
				}
			}

			if (bDesembalado) {
				MessageToast.show(this.oTextos.getText("ump_desembalado"));
			}

		},
		desembalarContenidoError: function(aResultados) {
			console.log(aResultados);
		},

		/* Submit de una ump ingresada manualmente, obtiene detalle del odata y la agrega a la lista */
		onSubmit_UMp_DesembalajeUmp: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// agregar la ump a la lista
				this.agregarUmp_DesembalajeUmp(aUmp[0]);
				// limpiar el input
				oSource.setValue("");
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		/* Escaneo de ump con la camara, luego obtiene detalle del odata y la agrega a la lista */
		onEscanear_UMp_DesembalajeUmp: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// agregar la ump a la lista
						this.agregarUmp_DesembalajeUmp(aUmp[0]);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Agregar un UMP escaneado <<y validado>> a la lista */
		agregarUmp_DesembalajeUmp: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/DesembalajeUmp/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			// generar key
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;
			oListaUMp[key] = ump;

			oAppModel.setProperty("/DesembalajeUmp/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_agregada", [ump.Exidv]));

			// disparar validaciones
			this.onValidaciones_DesembalajeUmp();
		},

		/* Limpiar lista de UMP escaneados */
		limpiarListaUMp_DesembalajeUmp: function() {

			var oAppModel = this.getView().getModel("appModel");
			oAppModel.setProperty("/DesembalajeUmp/Datos/ListaUMp", []);

			// disparar validaciones
			this.onValidaciones_DesembalajeUmp();
		},

		/* Borrar un ump de la lista */
		onDelete_UMp_DesembalajeUmp: function(oEvent) {
			// obtener key de la linea borrada
			var ump = oEvent.getParameter("listItem").getBindingContext("appModel").getObject();
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/DesembalajeUmp/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			delete oListaUMp[key];

			oAppModel.setProperty("/DesembalajeUmp/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_eliminada"));

			// disparar validaciones
			this.onValidaciones_DesembalajeUmp();
		},

		/* Validaciones de la operaci�n DesembalajeUmp */
		onValidaciones_DesembalajeUmp: function() {
			// Validar que los datos de appModel>/DesembalajeUmp/Datos est�n cargados
			//  y setear appModel>/DesembalajeUmp/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/DesembalajeUmp/Datos");

			var cantUMp = Object.keys(oData.ListaUMp).length
			if (cantUMp === 0) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/DesembalajeUmp/Validado", bValidado);

			return bValidado;
		},

		/********************  Fin DesembalajeUmp *****************************************************************************/

		/********************  Inicio RepackingUmpPallet *****************************************************************************/

		/* Value help de material embalaje*/
		onValueHelp_RepackingUmpPallet_MaterialEmbalaje: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RepackingUmpPallet/Datos");

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "P"
			})];

			var that = this;
			// llamar al value help gen�rico
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RepackingUmpPallet/Datos/MaterialEmbalaje", oObject.key);
				oAppModel.setProperty("/RepackingUmpPallet/Datos/MaterialEmbalajeDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_RepackingUmpPallet();
			});
		},

		/* Submit de una ump ingresada manualmente, obtiene detalle del odata y la agrega a la lista */
		onSubmit_UMp_RepackingUmpPallet: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// agregar la ump a la lista
				this.agregarUmp_RepackingUmpPallet(aUmp[0]);
				// limpiar el input
				oSource.setValue("");
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		/* Submit de una ump destino ingresada manualmente, obtiene detalle del odata y lo agrega al input */
		onSubmit_UMpDestino_RepackingUmpPallet: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// agregar al input
				this.agregarUmpDestino_RepackingUmpPallet(aUmp[0]);
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		onDelete_UMp_RepackingUmpPallet: function(oEvent) {
			// obtener key de la linea borrada
			var ump = oEvent.getParameter("listItem").getBindingContext("appModel").getObject();
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/RepackingUmpPallet/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
			delete oListaUMp[key];

			oAppModel.setProperty("/RepackingUmpPallet/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_eliminada"));

			// disparar validaciones
			this.onValidaciones_RepackingUmpPallet();
		},

		/* Validaciones de la operaci�n RepackingUmpPallet */
		onValidaciones_RepackingUmpPallet: function() {
			// Validar que los datos de appModel>/RepackingUmpPallet/Datos est�n cargados
			//  y setear appModel>/RepackingUmpPallet/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/RepackingUmpPallet/Datos");
			var cantUMp = Object.keys(oData.ListaUMp).length;

			if (oData.UmpDestino.TipoRepack === "nuevo") {

				if (cantUMp === 0) {
					bValidado = false;
				}

			} else if (oData.UmpDestino.TipoRepack === "existente") {

				if (!oData.UmpDestino || cantUMp === 0) {
					bValidado = false;
				}

				// validar que no haya pickeado la "Ump destino"
				if (oData.UmpDestino && cantUMp > 0) {
					var aUmpCargadas = oData.ListaUMp.filter(function(ump) {
						return ump.Exidv === oData.UmpDestino
					});
					if (aUmpCargadas.length > 0) {
						bValidado = false;
						MessageBox.error(that.oTextos.getText("error_ump_destino"));
					}
				}
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/RepackingUmpPallet/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n RepackingUmpPallet (contabilizar movimiento) */
		onAccionPrincipal_RepackingUmpPallet: function() {
			// Create con lo que haya cargado en appModel>/RepackingUmpPallet/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/RepackingUmpPallet/Datos");
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			if (!this.onValidaciones_RepackingUmpPallet()) {
				return;
			}

			var oRequest = {
				IvExidvPacking: (oData.TipoRepack === "existente") ? oData.UmpDestino : "",
				IvMatnr: (oData.TipoRepack === "nuevo") ? oData.MaterialEmbalaje : "",
				IvWerks: centroUsuario,
				HuRepack_To_PackNav: []
			};

			for (var ump in oData.ListaUMp) {
				oRequest.HuRepack_To_PackNav.push({
					HuExid: oData.ListaUMp[ump].Exidv,
					IvExidvPacking: oData.UmpDestino,
					IvMatnr: oData.MaterialEmbalaje,
					IvWerks: centroUsuario
				});
			}

			this.getView().getModel().create("/HU_REPACKSet", oRequest, {
				success: function(oData, oResponse) {

					var aMessages = [];
					var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
					// no se sabe que es oSapMessage, pasar siempre a array
					if (Array.isArray(oSapMessage)) {
						aMessages = oSapMessage;
					} else {
						// no es array
						aMessages.push(oSapMessage);
					}

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in aMessages) {
						var item = aMessages[index];
						if (item.severity !== "success") {
							bError = true;
						}
					}

					that._addHeaderMessages(aMessages, "RepackingUmpPallet");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
						that._openMessagePopover();
					} else {
						MessageBox.success(that.oTextos.getText("RepackingUmpPallet_success"));

						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "RepackingUmpPallet");
					}
				},
				error: that._errorOdata
			})

		},

		/* Escaneo de ump con la camara, luego obtiene detalle del odata y la agrega a la lista */
		onEscanear_UMp_RepackingUmpPallet: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// agregar la ump a la lista
						this.agregarUmp_RepackingUmpPallet(aUmp[0]);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Escaneo de ump destino con la camara, luego obtiene detalle del odata y lo agrega al input */
		onEscanear_UMpDestino_RepackingUmpPallet: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// agregar al input
						this.agregarUmpDestino_RepackingUmpPallet(aUmp[0]);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Agregar un UMP escaneado <<y validado>> a la lista */
		agregarUmp_RepackingUmpPallet: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty("/RepackingUmpPallet/Datos/ListaUMp");
			// agregar al listado de numeros que el usuario va escaneando: { 123: { }, 456: { } }
			// generar key
			var key = ump.Exidv + "," + ump.Venum + "," + ump.Vepos;
			oListaUMp[key] = ump;

			oAppModel.setProperty("/RepackingUmpPallet/Datos/ListaUMp", oListaUMp);
			MessageToast.show(this.oTextos.getText("ump_agregada", [ump.Exidv]));

			// disparar validaciones
			this.onValidaciones_RepackingUmpPallet();
		},

		/* Agregar un UMP destino escaneado <<y validado>> al input */
		agregarUmpDestino_RepackingUmpPallet: function(ump) {

			var oAppModel = this.getView().getModel("appModel");
			oAppModel.setProperty("/RepackingUmpPallet/Datos/UmpDestino", ump.Exidv);

			// disparar validaciones
			this.onValidaciones_RepackingUmpPallet();
		},

		/********************  Fin RepackingUmpPallet *****************************************************************************/

		/********************  Inicio RepackingMaterial *****************************************************************************/

		//Centro
		onValueHelp_RepackingMaterial_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RepackingMaterial/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RepackingMaterial/Datos/Centro", oObject.key);
				oAppModel.setProperty("/RepackingMaterial/Datos/CentroDescripcion", oObject.descripcion);

			});

		},
		/* Value help de almacen destino */
		onValueHelp_RepackingMaterial_AlmacenDestino: function(oEvent) {

			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RepackingMaterial/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACENCENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RepackingMaterial/Datos/AlmacenDestino", oObject.key);
				var sCentroDestino = oObject.descripcion.split(" ").length > 1 ? oObject.descripcion.split(" ")[0] : "";
				oAppModel.setProperty("/RepackingMaterial/Datos/CentroDestino", sCentroDestino);

				// disparar validaciones
				that.onValidaciones_RepackingMaterial();
			});

		},

		/* Value help de material */
		onValueHelp_RepackingMaterial_Material: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RepackingMaterial/Datos");

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "S"
			})];

			var aFilters = [new sap.ui.model.Filter({
				path: "Werks",
				operator: FilterOperator.EQ,
				value1: oData.Centro
			})];

			var that = this;
			// llamar al value help gen�rico
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RepackingMaterial/Datos/Material", oObject.key);
				oAppModel.setProperty("/RepackingMaterial/Datos/MaterialDescripcion", oObject.descripcion);
				oAppModel.setProperty("/RepackingMaterial/Datos/CantidadParcialUM", 0);
				oAppModel.setProperty("/RepackingMaterial/Datos/CantidadTotalUM", 0);

				// disparar validaciones
				that.onValidaciones_RepackingMaterial();

				// obtener la unidad y pegarla en el modelo
				var sPath = that.getView().getModel().createKey("/F4_MATNRSet", {
					Matnr: oObject.key
				});
				var oMaterial = that.getView().getModel().getObject(sPath);
				if (oMaterial) {
					oAppModel.setProperty("/RepackingMaterial/Datos/CantidadParcialUM", oMaterial.Meins);
					oAppModel.setProperty("/RepackingMaterial/Datos/CantidadTotalUM", oMaterial.Meins);
				} else {
					oAppModel.setProperty("/RepackingMaterial/Datos/CantidadParcialUM", "");
					oAppModel.setProperty("/RepackingMaterial/Datos/CantidadTotalUM", "");
				}

			});

		},

		/* Value help de lote */
		onValueHelp_RepackingMaterial_Lote: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RepackingMaterial/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			var that = this;

			// filtro centro
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// filtro material
			if (oData.Material) {
				aFilters.push(new Filter({
					path: 'Matnr',
					operator: FilterOperator.EQ,
					value1: oData.Material
				}));
			}

			// llamar al value help gen�rico
			this._openValueHelp('LOTE', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RepackingMaterial/Datos/Lote", oObject.key);

				// disparar validaciones
				that.onValidaciones_RepackingMaterial();
			});

		},

		/* Value help de material embalaje*/
		onValueHelp_RepackingMaterial_MaterialEmbalaje: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/RepackingMaterial/Datos");

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "P"
			})];

			var that = this;
			// llamar al value help gen�rico
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/RepackingMaterial/Datos/MaterialEmbalaje", oObject.key);
				oAppModel.setProperty("/RepackingMaterial/Datos/MaterialEmbalajeDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_RepackingMaterial();
			});
		},

		/* Validaciones de la operaci�n RepackingMaterial */
		onValidaciones_RepackingMaterial: function() {
			// Validar que los datos de appModel>/RepackingMaterial/Datos est�n cargados
			//  y setear appModel>/RepackingMaterial/Validado = true

			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/RepackingMaterial/Datos");

			if (!oData.Material || !oData.CantidadTotal || !oData.Lote || !oData.AlmacenDestino) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/RepackingMaterial/Validado", bValidado);

			return bValidado;
		},

		/* Acci�n principal de la operaci�n RepackingMaterial (contabilizar) */
		onAccionPrincipal_RepackingMaterial: function() {
			// Create con lo que haya cargado en appModel>/RepackingMaterial/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/RepackingMaterial/Datos");
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			if (!this.onValidaciones_RepackingMaterial()) {
				return;
			}

			var oRequest = {
				Charg: oData.Lote,
				Lgort: oData.AlmacenDestino,
				Matnr: oData.Material,
				MatnrPack: oData.MaterialEmbalaje,
				Meins: oData.CantidadParcialUM,
				WerksDest: centroUsuario,
				IvPartialQty: (oData.CantidadParcial) ? oData.CantidadParcial : "0",
				IvAuto: (oData.EmbalarAuto) ? "X" : " ",
				IvExidvPack: "",
				TotalQty: oData.CantidadTotal,
				MaterialPack_To_Bapiret2Nav: []
			};

			this.getView().getModel().create("/MATERIAL_PACKSet", oRequest, {
				success: function(oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oResponse.MaterialPack_To_Bapiret2Nav.results) {
						var item = oResponse.MaterialPack_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oResponse.MaterialPack_To_Bapiret2Nav.results, "RepackingMaterial");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
						that._openMessagePopover();
					} else {
						MessageBox.success(that.oTextos.getText("RepackingMaterial_success"));

						// limpiar los datos de este objeto del modelo
						that._onLimpiarPantalla(null, "RepackingMaterial");
					}

				},
				error: that._errorOdata
			})

		},

		/********************  Fin RepackingMaterial *****************************************************************************/

		/********************  Inicio ConsultaUmp *****************************************************************************/

		/* Submit de una ump ingresada manualmente, obtiene detalle del odata y la agrega a la lista */
		onSubmit_UMp_ConsultaUmp: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			// llamar al odata
			this._getUmpSap(sCodigoIngresado).then((aUmp) => {
				// mostrar la ump
				this.mostrarUmp_ConsultaUmp(aUmp);

				// limpiar el input
				oSource.setValue("");
			}).catch((error) => {
				MessageBox.error(this.oTextos.getText("ump_invalida"));
			});

		},

		/* Escaneo de ump con la camara, luego obtiene detalle del odata y la agrega a la lista */
		onEscanear_UMp_ConsultaUmp: function(oEvent) {

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {
					// llamar al odata
					this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
						// mostrar la ump
						this.mostrarUmp_ConsultaUmp(aUmp);
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Mostrar la ump en pantalla */
		mostrarUmp_ConsultaUmp: function(ump) {
			var oAppModel = this.getView().getModel("appModel");
			if (ump.length === 1) {
				oAppModel.setProperty("/ConsultaUmp/Datos/Visible", false);
				oAppModel.setProperty("/ConsultaUmp/Datos/Visible2", true);
				oAppModel.setProperty("/ConsultaUmp/Datos/UM", ump[0].Exidv);
				oAppModel.setProperty("/ConsultaUmp/Datos/Centro", ump[0].Werks);
				oAppModel.setProperty("/ConsultaUmp/Datos/Almacen", ump[0].Lgort);
				oAppModel.setProperty("/ConsultaUmp/Datos/Material", ump[0].Matnr);
				oAppModel.setProperty("/ConsultaUmp/Datos/MaterialDescripcion", ump[0].Maktx);
				oAppModel.setProperty("/ConsultaUmp/Datos/Documento", ump[0].Vbeln);
				oAppModel.setProperty("/ConsultaUmp/Datos/Posicion", ump[0].Posnr);
				oAppModel.setProperty("/ConsultaUmp/Datos/Lote", ump[0].Charg);
				oAppModel.setProperty("/ConsultaUmp/Datos/Fecha", ump[0].Wdatu);
				oAppModel.setProperty("/ConsultaUmp/Datos/PesoNeto", ump[0].Ntgew);
				oAppModel.setProperty("/ConsultaUmp/Datos/PesoBruto", ump[0].Brgew);
				oAppModel.setProperty("/ConsultaUmp/Datos/UnMedAlt", ump[0].VemehAlte);

				oAppModel.setProperty("/ConsultaUmp/Datos/MaterialEmbalaje", ump[0].Vhilm);
				oAppModel.setProperty("/ConsultaUmp/Datos/Cantidad", ump[0].Vemng);
				oAppModel.setProperty("/ConsultaUmp/Datos/UnMed", ump[0].Vemeh);
				oAppModel.setProperty("/ConsultaUmp/Datos/ClasePosicion", ump[0].Velin);
			} else {
				oAppModel.setProperty("/ConsultaUmp/Datos/Visible", true);
				oAppModel.setProperty("/ConsultaUmp/Datos/Visible2", false);
				var oListaPosiciones = {};
				for (var i = 0; i < ump.length; i++) {
					var item = ump[i];

					if (!oListaPosiciones[item.Exidv]) {
						// agregar nueva posicion
						oListaPosiciones[i] = {
							UM: item.Exidv,
							Centro: item.Werks,
							Almacen: item.Lgort,
							Material: item.Matnr,
							MaterialDescripcion: item.Maktx,
							Documento: item.Vbeln,
							Posicion: item.Posnr, // unidad de venta
							Lote: item.Charg,
							Fecha: item.Wdatu,
							PesoNeto: item.Ntgew,
							PesoBruto: item.Brgew,
							UnMedAlt: item.VemehAlte,
							MaterialEmbalaje: item.Vhilm,
							Cantidad: item.Vemng,
							UnMed: item.Vemeh,
							ClasePosicion: item.Velin
						};
					}
				}
				oAppModel.setProperty("/ConsultaUmp/Datos/ListaUMp", oListaPosiciones);
			}

			oAppModel.setProperty("/ConsultaUmp/Validado", true);

		},

		/********************  Fin ConsultaUmp *****************************************************************************/

		/********************  Inicio ConsultaLotes *****************************************************************************/
		onValueHelp_ConsultaLotes_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/ConsultaLotes/Datos/Centro", oObject.key);
				oAppModel.setProperty("/ConsultaLotes/Datos/CentroDescripcion", oObject.descripcion);

			});

		},

		onValueHelp_ConsultaLotes_Material: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
			var that = this;

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "L"
			})];

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: oData.Centro
			}));

			// llamar al value help gen�rico
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/ConsultaLotes/Datos/Material", oObject.key);
				oAppModel.setProperty("/ConsultaLotes/Datos/DescripcionMaterial", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_ConsultaLotes();
			});

		},

		/* Submit del input de Material */
		onSubmit_Material_ConsultaLotes: function(oEvent) {

			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
			var material = oEvent.getParameter("value");
			oAppModel.setProperty("/ConsultaLotes/Datos/Material", material);

			this.onValidaciones_ConsultaLotes();
		},

		// onSubmit_Lote_ConsultaLotes: function (oEvent) {

		//  var oAppModel = this.getView().getModel("appModel");
		//  var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
		//  var cantidad = oEvent.getObject().Clabs.toString() + " " + oEvent.getObject().Meins.toString();
		//  oAppModel.setProperty("/ConsultaLotes/Datos/CantidadUM", cantidad);

		//  this.onValidaciones_ConsultaLotes();
		// },

		onValueHelp_ConsultaLotes_Lote: function(oEvent) {
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
			var that = this;
			var aFilters = [new sap.ui.model.Filter({
				path: "Matnr",
				operator: FilterOperator.EQ,
				value1: oAppModel.getProperty("/ConsultaLotes/Datos/Material")
			})];

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: oData.Centro
			}));
			// llamar al value help gen�rico
			this._openValueHelp('LOTE', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/ConsultaLotes/Datos/Lote", oObject.key);

				// disparar validaciones
				that.onValidaciones_ConsultaLotes();

				// obtener la unidad y pegarla en el modelo
				var sPath = that.getView().getModel().createKey("/F4_CHARGSet", {
					Lgort: oAppModel.getProperty("/ConsultaLotes/Datos/Almacen"),
					Matnr: oAppModel.getProperty("/ConsultaLotes/Datos/Material"),
					Werks: oAppModel.getProperty("/ConsultaLotes/Datos/Centro"),
					Charg: oObject.key
				});

				var oLote = that.getView().getModel().getObject(sPath);
				var cantidadUM = "";
				if (oLote) {
					cantidadUM = oLote.Clabs.toString() + " " + oLote.Meins.toString();
				}
				oAppModel.setProperty("/ConsultaLotes/Datos/CantidadUM", cantidadUM);
			});

		},

		/* Submit del input de Lote */
		onSubmit_Lote_ConsultaLotes: function(oEvent) {

			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
			var lote = oEvent.getParameter("value");
			oAppModel.setProperty("/ConsultaLotes/Datos/Lote", lote);

			// obtener la unidad y pegarla en el modelo
			var sPath = that.getView().getModel().createKey("/F4_CHARGSet", {
				Lgort: oAppModel.getProperty("/ConsultaLotes/Datos/Almacen"),
				Matnr: oAppModel.getProperty("/ConsultaLotes/Datos/Material"),
				Werks: oAppModel.getProperty("/ConsultaLotes/Datos/Centro"),
				Charg: lote
			});

			var oLote = that.getView().getModel().getObject(sPath);
			var cantidadUM = "";
			if (oLote) {
				cantidadUM = oLote.Clabs.toString() + " " + oLote.Meins.toString();
			}
			oAppModel.setProperty("/ConsultaLotes/Datos/CantidadUM", cantidadUM);

			this.onValidaciones_ConsultaLotes();
		},

		onValueHelp_ConsultaLotes_Almacen: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
			var that = this;
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");

			aFilters.push(new Filter({
				path: 'IvWhitHu',
				operator: FilterOperator.EQ,
				value1: "X"
			}));

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico - ALMACEN_CON_HU USA LA ENTIDAD F4_LGORTInv y el mismo fragment de valuehelp ALMACEN
			this._openValueHelp('ALMACEN_CON_HU', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/ConsultaLotes/Datos/Almacen", oObject.key);
				oAppModel.setProperty("/ConsultaLotes/Datos/AlmacenDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_ConsultaLotes();
			});

		},

		/* Submit del input de Almacen */
		onSubmit_Almacen_ConsultaLotes: function(oEvent) {

			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaLotes/Datos");
			var almacen = oEvent.getParameter("value");
			oAppModel.setProperty("/ConsultaLotes/Datos/Almacen", almacen);

			this.onValidaciones_ConsultaLotes();
		},

		onValidaciones_ConsultaLotes: function() {
			// Validar que los datos de appModel>/RepackingMaterial/Datos est�n cargados
			//  y setear appModel>/RepackingMaterial/Validado = true
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/ConsultaLotes/Datos");
			var centroUsuario = this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			if (!oData.Centro) {
				this.getView().getModel("appModel").setProperty("/ConsultaLotes/Datos/Centro", centroUsuario);
			}

			if (!oData.Material || !oData.Almacen || !oData.Lote || !oData.Centro) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/ConsultaLotes/Validado", bValidado);
			if (bValidado) {
				// var oDataLimpio = models.createAppModel().getProperty("/ConsultaLotes");
				// oDataLimpio.Datos.Material = oData.Material;                               
				// oDataLimpio.Datos.Almacen = oData.Almacen;                               
				// oDataLimpio.Datos.Lote = oData.Lote;                               
				// oDataLimpio.Datos.Centro = oData.Centro;                               
				// oDataLimpio.Datos.Disp = oData.Disp;                               
				// oDataLimpio.Validado = true;                               
				// this.getView().getModel("appModel").setProperty("/ConsultaLotes", oDataLimpio);
				this.cargar_lotes_ConsultaLotes(oData.Material, oData.Almacen, oData.Lote, oData.Centro, oData.Disp);
			}
			return bValidado;
		},

		cargar_lotes_ConsultaLotes: function(Material, Almacen, Lote, Centro, Disponible) {
			var oAppModel = this.getView().getModel("appModel");
			var oTablaUMp = oAppModel.getProperty("/ConsultaLotes/Datos/TablaUMp");
			var vDisponible = "";
			if (Disponible) {
				vDisponible = "X";
			}
			// Ir a obtener la cabecera y posiciones con entrega
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("IvMatnr", sap.ui.model.FilterOperator.EQ, Material));
			aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Centro));

			aFilter.push(new sap.ui.model.Filter("IvLgort", sap.ui.model.FilterOperator.EQ, Almacen));
			aFilter.push(new sap.ui.model.Filter("IvCharg", sap.ui.model.FilterOperator.EQ, Lote));
			aFilter.push(new sap.ui.model.Filter("IvDisp", sap.ui.model.FilterOperator.EQ, vDisponible));
			this.getView().getModel().read("/HU_DISPSet", {
				filters: aFilter,
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						oTablaUMp[oData.results[i].Exidv] = {
							UM: oData.results[i].Exidv
						};
					}
					oAppModel.setProperty("/ConsultaLotes/Datos/TablaUMp", oTablaUMp);
				},
				error: function() {
					sap.m.MessageBox.error("No se encontraron datos");
					oAppModel.setProperty("/ConsultaLotes/Validado", false);
				}.bind(this)
			})
		},

		onPress_ConsultaLotes_NavegarUM: function(oEvent) {
			var oItem = oEvent.getSource().getParent();
			var oTabla = oEvent.getSource().getParent().getParent();
			var oDatos = oTabla.getModel("appModel").getProperty(oItem.getBindingContextPath());
			var ump = oDatos.UM;
			// llamar al odata
			this._getUmpSap(ump).then((aUmp) => {
				// mostrar la ump
				this.mostrarUmp_ConsultaUmp(aUmp);

			});

			this._internNavTo("ConsultaUmp");
		},

		/********************  Fin ConsultaLotes *****************************************************************************/

		/********************  Inicio ConsultaStock *****************************************************************************/
		onValueHelp_ConsultaStock_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaStock/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/ConsultaStock/Datos/Centro", oObject.key);
				oAppModel.setProperty("/ConsultaStock/Datos/CentroDescripcion", oObject.descripcion);

			});

		},

		onValueHelp_ConsultaStock_Material: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaStock/Datos");
			var that = this;

			var aFilters = [new sap.ui.model.Filter({
				path: "Type",
				operator: FilterOperator.EQ,
				value1: "A"
			})];

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: oData.Centro
			}));

			// llamar al value help gen�rico
			var that = this;
			this._openValueHelp('MATERIAL', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/ConsultaStock/Datos/Material", oObject.key);
				oAppModel.setProperty("/ConsultaStock/Datos/MaterialDescripcion", oObject.descripcion);
				that.onValidaciones_ConsultaStock();
			});

		},

		/* Submit del input de Material */
		onSubmit_Material_ConsultaStock: function(oEvent) {

			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaStock/Datos");
			var material = oEvent.getParameter("value");
			oAppModel.setProperty("/ConsultaStock/Datos/Material", material);

			this.onValidaciones_ConsultaStock();
		},

		onValueHelp_ConsultaStock_Almacen: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaStock/Datos");
			var that = this;
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));
			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/ConsultaStock/Datos/Almacen", oObject.key);
				oAppModel.setProperty("/ConsultaStock/Datos/AlmacenDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_ConsultaStock();
			});
		},

		/* Submit del input de Almacen */
		onSubmit_Almacen_ConsultaStock: function(oEvent) {

			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/ConsultaStock/Datos");
			var almacen = oEvent.getParameter("value");
			oAppModel.setProperty("/ConsultaStock/Datos/Almacen", almacen);

			this.onValidaciones_ConsultaStock();
		},

		onValidaciones_ConsultaStock: function() {
			// Validar que los datos de appModel>/ConsultaStock/Datos est�n cargados
			//  y setear appModel>/ConsultaStock/Validado = true
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/ConsultaStock/Datos");
			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			if (!oData.Centro) {
				this.getView().getModel("appModel").setProperty("/ConsultaStock/Datos/Centro", centroUsuario);
			}

			if (!oData.Material || !oData.Centro) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/ConsultaStock/Validado", bValidado);
			if (bValidado) {
				this.cargarStock_ConsultaStock(oData.Material, oData.Almacen, oData.Centro);
			}
			return bValidado;
		},

		cargarStock_ConsultaStock: function(Material, Almacen, Centro) {
			var oAppModel = this.getView().getModel("appModel");

			// Ir a obtener la cabecera y posiciones con entrega
			var aFilter = [];
			if (Centro) {
				aFilter.push(new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, Centro));
			}
			if (Almacen) {
				aFilter.push(new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.EQ, Almacen));
			}
			aFilter.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, Material));
			this.getView().getModel().read("/HU_STOCKSet", {
				filters: aFilter,
				success: function(oData) {
					oAppModel.setProperty("/ConsultaStock/Datos/MaterialDescripcion", oData.results[0].Maktx);
					oAppModel.setProperty("/ConsultaStock/Datos/LibreUtilizacion", oData.results[0].Labst);
					oAppModel.setProperty("/ConsultaStock/Datos/EnTraslado", oData.results[0].Umlme);
					oAppModel.setProperty("/ConsultaStock/Datos/InspCalidad", oData.results[0].Insme);
					oAppModel.setProperty("/ConsultaStock/Datos/Bloqueado", oData.results[0].Speme);
					oAppModel.setProperty("/ConsultaStock/Datos/EnTransito", oData.results[0].Trans);
				},
				error: function() {
					sap.m.MessageBox.error("No se encontraron datos");
					oAppModel.setProperty("/ConsultaStock/Validado", false);
				}.bind(this)
			})
		},
		/********************  Fin ConsultaStock *****************************************************************************/

		/********************  Inicio TrasladoEntreCentrosConPedidoCreacionEntregaSalida *****************************************************************************/

		/* Value help de entrega */
		onValueHelp_TrasladoEntreCentrosConPedidoCreacionEntregaSalida_Pedido: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos");
			var that = this;

			// llamar al value help gen�rico
			this._openValueHelp('PEDIDO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos/Pedido", oObject.key);
				that.onSubmit_Pedido_TrasladoEntreCentrosConPedidoCreacionEntregaSalida("", oObject.key);
			});

		},

		/* Value help de Puesto exped */
		onValueHelp_TrasladoEntreCentrosConPedidoCreacionEntregaSalida_Vstel: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos");
			var that = this;

			// llamar al value help gen�rico
			this._openValueHelp('PUESTO_EXPED', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos/Vstel", oObject.key);
				that.onValidaciones_TrasladoEntreCentrosConPedidoCreacionEntregaSalida();
			});

		},

		/* Valida que la cantidad pickeada de cada posici�n coincida con la requerida */
		onValidaciones_TrasladoEntreCentrosConPedidoCreacionEntregaSalida: function() {
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos");

			// validar que haya al menos una posicion seleccionada
			var bPosicionSeleccionada = false;
			for (var i in oData.ListaPosiciones) {
				if (oData.ListaPosiciones[i].Selected) {
					bPosicionSeleccionada = true;
					break;
				}
			}

			if (!oData.Pedido || !oData.FechaCreacion || !oData.Vstel || !bPosicionSeleccionada) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Validado", bValidado);

			return bValidado;
		},

		/* Submit de input de pedido, carga lista de posiciones */
		onSubmit_Pedido_TrasladoEntreCentrosConPedidoCreacionEntregaSalida: function(oEvent, oPedido) {
			var pedido;
			if (oEvent) {
				pedido = oEvent.getParameter("value");
			} else {
				pedido = oPedido;
			}

			var oAppModel = this.getView().getModel("appModel");

			// Obtener la cabecera y posiciones de la entrega
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Ebeln", sap.ui.model.FilterOperator.EQ, pedido));
			var that = this;
			this.getView().getModel().read("/STO_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var oListaPosiciones = {};
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];
						// cabecera, posiciones vienen todas juntas, descomprimir: 
						if (!oListaPosiciones[item.Ebelp]) {
							// agregar nueva posicion
							oListaPosiciones[item.Ebelp] = {
								Ebelp: item.Ebelp,
								Reswk: item.Reswk,
								Matnr: item.Matnr,
								Maktx: item.Maktx,
								Menge: item.Menge,
								Meins: item.Meins,
								Werks: item.Werks,
								Lgort: item.Lgort,
								Selected: false // tiene que marcar las posiciones que se trasladan al pedido
							};
						}

					}
					oAppModel.setProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos/ListaPosiciones", oListaPosiciones);
					that.onValidaciones_TrasladoEntreCentrosConPedidoCreacionEntregaSalida();
				},
				error: function() {
					// limpiar los datos de la entrega
					this._onLimpiarPantalla(null, "TrasladoEntreCentrosConPedidoCreacionEntregaSalida");
					MessageBox.error("No se encontr� informaci�n para el pedido elegido");
				}.bind(this)
			})
		},

		/* Acci�n principal de la operaci�n TrasladoEntreCentrosConPedidoCreacionEntregaSalida (Grabar) */
		onAccionPrincipal_TrasladoEntreCentrosConPedidoCreacionEntregaSalida: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosConPedidoCreacionEntregaSalida/Datos");
			var bQuedanPosicionesSinSeleccionar = false;

			if (!this.onValidaciones_TrasladoEntreCentrosConPedidoCreacionEntregaSalida()) {
				return;
			}

			// FALTA MAPEAR A LA ENTIDAD CORRECTA
			// Y COPIAR SOLO LAS POSICIONES CON Selected = true

			// pasar fecha a formato SAP
			var fecha = oData.FechaCreacion.toISOString().substr(0, 10).replaceAll("-", "");

			var oRequest = {
				Vstel: oData.Vstel,
				Ev_Vbeln: oData.Pedido,
				Datum: fecha,
				InDeliStoCreate_to_ItemsNav: [],
				InDeliStoCreate_To_Bapiret2Nav: []
			};

			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				if (oPos.Selected) {
					oRequest.InDeliStoCreate_to_ItemsNav.push({
						Vstel: oData.Vstel,
						Ebeln: oData.Pedido,
						Ebelp: oPos.Ebelp,
						Reswk: oPos.Reswk,
						Matnr: oPos.Matnr,
						Maktx: oPos.Maktx,
						Menge: oPos.Menge,
						Meins: oPos.Meins,
						Werks: oPos.Werks,
						Lgort: oPos.Lgort,
					})
				} else {
					// si quedan posiciones sin seleccionar, no limpiar la pantalla al terminar
					bQuedanPosicionesSinSeleccionar = true;
				}
			}
			var that = this;
			this.getView().getModel().create("/IN_DELI_STO_CREATESet", oRequest, {
				success: function(oData, oResponse) {

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in oData.InDeliStoCreate_To_Bapiret2Nav.results) {
						var item = oData.InDeliStoCreate_To_Bapiret2Nav.results[index];
						if (item.Type === "E") {
							bError = true;
						}
					}

					// agregar los mensajes al log
					that._addBapiMessages(oData.InDeliStoCreate_To_Bapiret2Nav.results, "TrasladoEntreCentrosConPedidoCreacionEntregaSalida");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreCentrosConPedidoCreacionEntregaSalida_success"));

						if (!bQuedanPosicionesSinSeleccionar) {
							// // limpiar los datos de este objeto del modelo
							that._onLimpiarPantalla(null, "TrasladoEntreCentrosConPedidoCreacionEntregaSalida");
						} else {
							// borrar todas las posiciones ya utilizadas (seleccionadas)
							oData.ListaPosiciones = oData.ListaPosiciones.filter(item => item.Selected === false);
						}
					}
					that._openMessagePopover();

				},
				error: that._errorOdata
			})
		},

		/********************  Fin TrasladoEntreCentrosConPedidoCreacionEntregaSalida *****************************************************************************/

		/********************  Inicio TrasladoEntreCentrosConPedidoPickingEntregaSalida *****************************************************************************/
		onValueHelp_TrasladoEntreCentrosConPedidoPickingEntregaSalida_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/Centro", oObject.key);
				oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/CentroDescripcion", oObject.descripcion);

			});

		},
		onValueHelp_TrasladoEntreCentrosConPedidoPickingEntregaSalida_Ruta: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos");
			var that = this;
			this._openValueHelp('RUTA', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/Ruta", oObject.key);
				oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/RutaDescripcion", oObject.descripcion);

			});

		},

		/* Value help de entrega */
		// onValueHelp_TrasladoEntreCentrosConPedidoPickingEntregaSalida_Entrega: function (oEvent) {
		//  var aFilters = [];
		//  var oAppModel = this.getView().getModel("appModel");
		//  var oData = oAppModel.getProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos");
		//  var that = this;

		//  aFilters.push(new Filter({
		//    path: 'Type',
		//    operator: FilterOperator.EQ,
		//    value1: 'P' // entrega recepci�n
		//  }));

		//  aFilters.push(new Filter({
		//    path: 'Werks',
		//    operator: FilterOperator.EQ,
		//    value1: oData.Centro // centro
		//  }));

		//  // llamar al value help gen�rico
		//  this._openValueHelp('ENTREGA', aFilters, function (oObject) {
		//    // en oObject viene un objeto con {key: xxx, descripcion: xxx}
		//    oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/Entrega", oObject.key);
		//    that.onSubmit_Entrega_TrasladoEntreCentrosConPedidoPickingEntregaSalida("", oObject.key);
		//  });

		// },
		onValueHelp_TrasladoEntreCentrosConPedidoPickingEntregaSalida_Entrega: async function(oEvent) {
			try {
				var oServicioOdata = this.getOwnerComponent().getModel();
				var aFilters = [];
				var oAppModel = this.getView().getModel("appModel");
				var oData = oAppModel.getProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos");
				var that = this;

				aFilters.push(new Filter({
					path: 'Type',
					operator: FilterOperator.EQ,
					value1: 'P' // entrega recepci�n
				}));

				aFilters.push(new Filter({
					path: 'Werks',
					operator: FilterOperator.EQ,
					value1: oData.Centro // centro
				}));

				var sValueHelpId = "ENTREGA_PICKING_ENT_SALIDA_VTAS";
				var fnCallback = (function(oObject) {
					// en oObject viene un objeto con {key: xxx, descripcion: xxx}
					oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/Entrega", oObject.key);
					that.onSubmit_Entrega_TrasladoEntreCentrosConPedidoPickingEntregaSalida("", oObject.key);
				});

				var oData = this.getView().getModel("valuehelpModel").getData();
				var oConfig = oData[sValueHelpId];
				if (!oConfig) {
					return;
				}

				this.getView().setBusy(true);
				var sUrl = '/' + oConfig.EntitySet;
				var oResponse = await new Promise(resolve => {
					oServicioOdata.read(sUrl, {
						filters: aFilters,
						"success": function(response, header) {
							resolve(response.results);
						},
						"error": function(response) {
							resolve([]);
						}
					});
				});

				//Formateamos los campos y creamos nuevos
				try {
					oResponse.forEach(e => {
						var sNombreDestinatario = e.KunnrName;
						var sCodigoDestinatario = e.Kunnr;
						var sDestinatarioCompleto = `${sNombreDestinatario} (${sCodigoDestinatario})`;
						var sFechaFormateada = this.formatter.formatDate(e.Wadat);

						e.FechaFormateada = sFechaFormateada;
						e.DestinatarioCompleto = sDestinatarioCompleto;
					});
				} catch (_error) {
					console.log("Error al formatear campos de ayuda de b�squeda de entrega");
					this.getView().setBusy(false);
				}

				var oModelAyudaBusqueda = new JSONModel(oResponse);

				// destruirlo si ya exist�a
				if (this._oValueHelpDialog) {
					this._oValueHelpDialog.destroy();
				}

				this._oValueHelpDialog = sap.ui.xmlfragment(oConfig.Fragment, this);
				this.getView().addDependent(this._oValueHelpDialog);
				var oFilterBar = this._oValueHelpDialog.getFilterBar();
				oFilterBar.setFilterBarExpanded(true);

				this.oColModel = new JSONModel({
					cols: oConfig.Columns
				});

				this._oValueHelpDialog.getTableAsync().then(function(oTable) {
					oTable.setModel(oModelAyudaBusqueda);
					oTable.setModel(this.oColModel, "columns");

					if (oTable.bindRows) oTable.bindAggregation("rows", "/");

					if (oTable.bindItems) {
						oTable.bindAggregation("items", "/", function() {
							return new ColumnListItem({
								cells: oConfig.Columns.map(function(column) {
									return new new Label({
										text: "{" + column.template + "}"
									});
								})
							});
						});
					}

					this._oValueHelpDialog.update();
				}.bind(this));

				// bindearlo a la configuraci�n seleccionada
				this._oValueHelpDialog.bindElement("valuehelpModel>/" + sValueHelpId);

				// setearle la funcion de callback para que la llame cuando el usuario seleccione algo en onValueHelpOkPress
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/Callback", fnCallback);

				// setearle los filtros iniciales
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/aFilters", aFilters || []);

				this.getView().setBusy(false);
				this._oValueHelpDialog.open();
			} catch (error) {
				console.log("Error ayuda b�squeda de entrega");
				MessageToast.show("Error ayuda b�squeda de entrega");
				this.getView().setBusy(false);
			}
		},

		/* Value help de almacen (posicion) */
		onValueHelp_TrasladoEntreCentrosConPedidoPickingEntregaSalida_Almacen: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos");
			var sPath = oEvent.getSource().getBindingContext("appModel").getPath();
			var that = this;

			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				// setear almac�n a nivel posici�n
				oAppModel.setProperty(sPath + "/Lgort", oObject.key);

				that.onSubmit_Almacen_TrasladoEntreCentrosConPedidoPickingEntregaSalida(null, sPath);
			});

		},

		/* Submit del input de almacen, reinicia lista de UMp */
		onSubmit_Almacen_TrasladoEntreCentrosConPedidoPickingEntregaSalida: function(oEvent, pPathPosicion) {
			// al cambiar el almacen se reinician las UMp pickeadas, porque hay que traerlas de SAP nuevamente para este almacen
			var sPathPosicion;
			if (oEvent) {
				sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			} else {
				sPathPosicion = pPathPosicion;
			}
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/ListaUMp", {});
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/UMpCargadas", false);
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/FaltaPickear", true);
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/CantPickeada", 0);
		},

		/* Valida que la cantidad pickeada de cada posici�n coincida con la requerida */
		onValidaciones_TrasladoEntreCentrosConPedidoPickingEntregaSalida: function() {
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos");

			// validar que haya pickeado todas las ump de todas las posiciones y que la cantidad coincida con el total
			var bFaltaPickearPosicion = false;
			// y que todas tengan completo lote y almacen
			var bFaltanDatosPosicion = false;
			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				if (oPos.Kostk !== "C") {
					if (oPos.CantPickeada < parseFloat(oPos.Lfimg) || oPos.FaltaPickear) {
						bFaltaPickearPosicion = true;
					}
					if (!oPos.Lgort) {
						bFaltanDatosPosicion = true;
					}
				}
			}

			if (!oData.Entrega || bFaltaPickearPosicion || bFaltaPickearPosicion) {
				bValidado = false;
			}
			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Validado", bValidado);

			return bValidado;
		},

		/* Submit de input de entrega, carga lista de posiciones */
		onSubmit_Entrega_TrasladoEntreCentrosConPedidoPickingEntregaSalida: function(oEvent, oEntrega) {
			var entrega;
			if (oEvent) {
				entrega = oEvent.getParameter("value");
			} else {
				entrega = oEntrega;
			}

			var oAppModel = this.getView().getModel("appModel");
			var almacenInsumos = oAppModel.getProperty("/AlmacenInsumos");

			// Obtener la cabecera y posiciones de la entrega
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, entrega));
			var that = this;
			this.getView().getModel().read("/DELI_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var oListaPosiciones = {};
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];

						// cabecera de la entrega
						oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/Vstel", item.Vstel);
						oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/Lfdat", item.Lfdat);
						oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/KunnrName", item.KunnrName);

						// cabecera, posiciones y UMp vienen todas juntas, descomprimir: 
						if (!oListaPosiciones[item.Posnr]) {
							// agregar nueva posicion
							oListaPosiciones[item.Posnr] = {
								Posnr: item.Posnr,
								Werks: item.Werks,
								Lgort: item.Lgort || almacenInsumos,
								Matnr: item.Matnr,
								Arktx: item.Arktx,
								Lfimg: item.Lfimg,
								Meins: item.Meins,
								Charg: item.Charg,
								Pikmg: item.Pikmg,
								Kostk: item.Kostk, // indicador contabilizada, C= contabilizada
								CantPickeada: 0,
								FaltaPickear: true,
								UMpCargadas: false, // marca si hicimos el read a OUT_DELI_GM_HUSet para llenar ListaUMp
								ListaUMp: {}
							};
						}

					}
					oAppModel.setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/ListaPosiciones", oListaPosiciones);
					that.onValidaciones_TrasladoEntreCentrosConPedidoPickingEntregaSalida();
				},
				error: function() {
					// limpiar los datos de la entrega
					this._onLimpiarPantalla(null, "TrasladoEntreCentrosConPedidoPickingEntregaSalida");
					MessageBox.error("No se encontr� informaci�n para la entrega elegida");
				}.bind(this)
			})
		},

		/* Mostrar popup de pickeo con las HU *disponibles* para una posici�n */
		onVerUHs_UMp_TrasladoEntreCentrosConPedidoPickingEntregaSalida: function(oEvent) {
			var oAppModel = this.getView().getModel("appModel");
			var aFilters = [];
			var sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			var oPosicion = oAppModel.getObject(sPathPosicion);

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: oPosicion.Werks
			}));

			if (!oPosicion.Lgort) {
				sap.m.MessageToast.show("Seleccione un almac�n");
				return;
			}

			aFilters.push(new Filter({
				path: 'Lgort',
				operator: FilterOperator.EQ,
				value1: oPosicion.Lgort
			}));

			aFilters.push(new Filter({
				path: 'Matnr',
				operator: FilterOperator.EQ,
				value1: oPosicion.Matnr
			}));

			if (!oPosicion.UMpCargadas) {

				// cargar las UMp disponibles para la posici�n por material / centro / almac�n
				this.getView().getModel().read("/OUT_DELI_GM_HUSet", {
					filters: aFilters,
					success: function(oData) {

						if (oData.results.length < 1) {
							MessageBox.error(that.oTextos.getText("ump_no_disponible"));
							return;
						}
						var oListaUMp = {};
						// agregar las UMp a la lista de UMp de la posici�n
						for (var item of oData.results) {
							oListaUMp[item.Exidv] = {
								Venum: item.Venum,
								Matnr: item.Matnr,
								Arktx: item.Arktx || item.Matnr,
								Vepos: item.Vepos,
								Vemng: item.Vemng,
								Exidv: item.Exidv,
								Lfimg: item.Vemng,
								Charg: item.Charg,
								Lgort: item.Lgort,
								Vemeh: item.Vemeh,
								Pickeado: false, // esto se va actualizando a medida que pickea cosas
								PesosVisible: false
							}
						}

						oAppModel.setProperty(sPathPosicion + "/ListaUMp", oListaUMp);
						oAppModel.setProperty(sPathPosicion + "/UMpCargadas", true);
						oAppModel.setProperty(sPathPosicion + "/PesosVisible", false);

						// Abrir popup de pickeo
						this._popupPickeo(sPathPosicion, this.onValidaciones_TrasladoEntreCentrosConPedidoPickingEntregaSalida);

					}.bind(this),
					error: function(error) {
						MessageBox.error(this.oTextos.getText("ump_no_disponible_error"));
					}.bind(this),
				});

			} else {
				// Abrir popup de pickeo
				this._popupPickeo(sPathPosicion, this.onValidaciones_TrasladoEntreCentrosConPedidoPickingEntregaSalida);
			}

		},

		/* Acci�n principal de la operaci�n TrasladoEntreCentrosConPedidoPickingEntregaSalida (Grabar) */
		onAccionPrincipal_TrasladoEntreCentrosConPedidoPickingEntregaSalida: function() {
			// Create con lo que haya cargado en appModel>/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos");

			if (!this.onValidaciones_TrasladoEntreCentrosConPedidoPickingEntregaSalida()) {
				return;
			}

			var oRequest = {
				Vbeln: oData.Entrega,
				Cont: oData.Contabilizar ? "X" : "", // switch de contabilizar entrega
				Route: oData.Route,
				OutDeliGmCont_To_OutDeliContNav: [],
				OutDeliGmCont_To_OutDeliContHuNav: []
			};

			if (!oData.Contabilizar) {

				for (var i in oData.ListaPosiciones) {
					var oPos = oData.ListaPosiciones[i];

					// posiciones
					oRequest.OutDeliGmCont_To_OutDeliContNav.push({
						Vbeln: oData.Entrega,
						Posnr: oPos.Posnr,
						Pikmg: oPos.Lfimg
					});

					// HU
					for (var j in oPos.ListaUMp) {
						var oUmp = oPos.ListaUMp[j];
						if (oUmp.Pickeado) {
							// BEGIN FNOVO
							if (oUmp.Charg != "") {
								oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
									Vbeln: oData.Entrega,
									Posnr: oPos.Posnr,
									Exidv: oUmp.Exidv,
									Charg: oUmp.Charg,
									Vemng: oUmp.Vemng,
									Vemeh: oUmp.Vemeh,
									Lgort: oUmp.Lgort
								});
							} else {
								for (var i = 0; i < oUmp.Lotes.length; i++) {
									oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
										Vbeln: oData.Entrega,
										Posnr: oPos.Posnr,
										Exidv: oUmp.Exidv,
										Charg: oUmp.Lotes[i].Charg,
										Vemng: oUmp.Lotes[i].Vemng,
										Vemeh: oUmp.Lotes[i].Vemeh,
										Lgort: oUmp.Lgort
									});
								}

							}
						}
					}

					// /* Contar las HU pickeadas para esta posicion: 
					//  si es 1, se mandan los datos de lote en la posic�n,
					//  si >1, se mandan en estructura aparte
					// */
					// var cantUmpPickeadas = 0;
					// var oUMpPickeada;
					// for (var j in oPos.ListaUMp) {
					//  var oUMp = oPos.ListaUMp[j];
					//  if (oUMp.Pickeado) {
					//    cantUmpPickeadas++;
					//    oUMpPickeada = oUMp;
					//  }
					// }

					// // HU
					// if (cantUmpPickeadas > 1) {
					//  // posicion
					//  oRequest.OutDeliGmCont_To_OutDeliContNav.push({
					//    Vbeln: oData.Entrega,
					//    Posnr: oPos.Posnr,
					//    Pikmg: oPos.Lfimg,
					//  });
					//  // >1 HU, cargar estructura aparte
					//  for (var j in oPos.ListaUMp) {
					//    var oUMp = oPos.ListaUMp[j];
					//    if (oUMp.Pickeado) {
					//      oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
					//        Vbeln: oData.Entrega,
					//        Posnr: oPos.Posnr,
					//        // Lgort: oUMp.Lgort,
					//        Charg: oUMp.Charg,
					//        Exidv: oUMp.Exidv,
					//        Vemng: oUMp.Vemng,
					//        Vemeh: oUMp.Vrkme
					//      });
					//    }
					//  }
					// } else {
					//  // 1 HU, cargar en la posicion
					//  oRequest.OutDeliGmCont_To_OutDeliContNav.push({
					//    Vbeln: oData.Entrega,
					//    Posnr: oPos.Posnr,
					//    Pikmg: oPos.Lfimg,
					//    Charg: oUMpPickeada.Charg,
					//    Lgort: oUMpPickeada.Lgort
					//  });
					// }

				}

			}
			var that = this;
			this.getView().getModel().create("/OUT_DELI_GM_CONTSet", oRequest, {
				success: function(oData, oResponse) {

					var aMessages = [];
					var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
					// no se sabe que es oSapMessage, pasar siempre a array
					if (Array.isArray(oSapMessage)) {
						aMessages = oSapMessage;
					} else {
						// no es array
						aMessages.push(oSapMessage);
					}

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in aMessages) {
						var item = aMessages[index];
						if (item.severity !== "success") {
							bError = true;
						}
					}

					that._addHeaderMessages(aMessages, "TrasladoEntreCentrosConPedidoPickingEntregaSalida");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
						that._openMessagePopover();
					} else {
						MessageBox.success(that.oTextos.getText("TrasladoEntreCentrosConPedidoPickingEntregaSalida_success"));

						if (oRequest.Cont) {
							// limpiar los datos de este objeto del modelo, solo despu�s de contabilizar, no en pasos intermedios
							that._onLimpiarPantalla(null, "TrasladoEntreCentrosPickingEntregaSalida");
						} else {
							// poner kostk = C para que la tome como contabilizada en cada posicion
							var aListaPosiciones = that.getView().getModel("appModel").getProperty(
								"/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/ListaPosiciones");
							for (var i in aListaPosiciones) {
								aListaPosiciones[i].Kostk = "C";
							}
							that.getView().getModel("appModel").setProperty("/TrasladoEntreCentrosConPedidoPickingEntregaSalida/Datos/ListaPosiciones",
								aListaPosiciones);

						}
					}

				},
				error: that._errorOdata
			})
		},

		/********************  Fin TrasladoEntreCentrosConPedidoPickingEntregaSalida *****************************************************************************/

		/********************  Inicio EntregaPedidoVentasPickingEntregaSalida *****************************************************************************/
		onValueHelp_EntregaPedidoVentasPickingEntregaSalida_Centro: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");
			var that = this;
			this._openValueHelp('CENTRO', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Centro", oObject.key);
				oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/CentroDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada();
			});

		},
		//Ruta
		onValueHelp_EntregaPedidoVentasPickingEntregaSalida_Ruta: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var oData = oAppModel.getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");
			var that = this;
			this._openValueHelp('RUTA', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Ruta", oObject.key);
				oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/RutaDescripcion", oObject.descripcion);

				// disparar validaciones
				that.onValidaciones_TrasladoEntreAlmacenes2PasoConHUEntrada();
			});

		},

		/* Value help de entrega */
		onValueHelp_EntregaPedidoVentasPickingEntregaSalida_Entrega: async function(oEvent) {
			try {
				var oServicioOdata = this.getOwnerComponent().getModel();
				var aFilters = [];
				var oAppModel = this.getView().getModel("appModel");
				var oData = oAppModel.getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");
				var that = this;

				aFilters.push(new Filter({
					path: 'Type',
					operator: FilterOperator.EQ,
					value1: 'S' // entrega recepci�n
				}));

				aFilters.push(new Filter({
					path: 'Werks',
					operator: FilterOperator.EQ,
					value1: oData.Centro // centro
				}));

				var sValueHelpId = "ENTREGA_PICKING_ENT_SALIDA_VTAS";
				var fnCallback = (function(oObject) {
					// en oObject viene un objeto con {key: xxx, descripcion: xxx}
					oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Entrega", oObject.key);
					that.onSubmit_Entrega_EntregaPedidoVentasPickingEntregaSalida("", oObject.key);
				});

				var oData = this.getView().getModel("valuehelpModel").getData();
				var oConfig = oData[sValueHelpId];
				if (!oConfig) {
					return;
				}

				this.getView().setBusy(true);
				var sUrl = '/' + oConfig.EntitySet;
				var oResponse = await new Promise(resolve => {
					oServicioOdata.read(sUrl, {
						filters: aFilters,
						"success": function(response, header) {
							resolve(response.results);
						},
						"error": function(response) {
							resolve([]);
						}
					});
				});

				//Formateamos los campos y creamos nuevos
				try {
					oResponse.forEach(e => {
						var sNombreDestinatario = e.KunnrName;
						var sCodigoDestinatario = e.Kunnr;
						var sDestinatarioCompleto = `${sNombreDestinatario} (${sCodigoDestinatario})`;
						var sFechaFormateada = this.formatter.formatDate(e.Wadat);

						e.FechaFormateada = sFechaFormateada;
						e.DestinatarioCompleto = sDestinatarioCompleto;
					});
				} catch (_error) {
					console.log("Error al formatear campos de ayuda de b�squeda de entrega");
					this.getView().setBusy(false);
				}

				var oModelAyudaBusqueda = new JSONModel(oResponse);

				// destruirlo si ya exist�a
				if (this._oValueHelpDialog) {
					this._oValueHelpDialog.destroy();
				}

				this._oValueHelpDialog = sap.ui.xmlfragment(oConfig.Fragment, this);
				this.getView().addDependent(this._oValueHelpDialog);
				var oFilterBar = this._oValueHelpDialog.getFilterBar();
				oFilterBar.setFilterBarExpanded(true);

				this.oColModel = new JSONModel({
					cols: oConfig.Columns
				});

				this._oValueHelpDialog.getTableAsync().then(function(oTable) {
					oTable.setModel(oModelAyudaBusqueda);
					oTable.setModel(this.oColModel, "columns");

					if (oTable.bindRows) oTable.bindAggregation("rows", "/");

					if (oTable.bindItems) {
						oTable.bindAggregation("items", "/", function() {
							return new ColumnListItem({
								cells: oConfig.Columns.map(function(column) {
									return new new Label({
										text: "{" + column.template + "}"
									});
								})
							});
						});
					}

					this._oValueHelpDialog.update();
				}.bind(this));

				// bindearlo a la configuraci�n seleccionada
				this._oValueHelpDialog.bindElement("valuehelpModel>/" + sValueHelpId);

				// setearle la funcion de callback para que la llame cuando el usuario seleccione algo en onValueHelpOkPress
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/Callback", fnCallback);

				// setearle los filtros iniciales
				this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/aFilters", aFilters || []);

				this.getView().setBusy(false);
				this._oValueHelpDialog.open();
			} catch (error) {
				console.log("Error ayuda b�squeda de entrega");
				MessageToast.show("Error ayuda b�squeda de entrega");
				this.getView().setBusy(false);
			}
		},
		// onValueHelp_EntregaPedidoVentasPickingEntregaSalida_Entrega: function (oEvent) {
		//  var aFilters = [];
		//  var oAppModel = this.getView().getModel("appModel");
		//  var oData = oAppModel.getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");
		//  var that = this;

		//  aFilters.push(new Filter({
		//    path: 'Type',
		//    operator: FilterOperator.EQ,
		//    value1: 'S' // entrega recepci�n
		//  }));

		//  aFilters.push(new Filter({
		//    path: 'Werks',
		//    operator: FilterOperator.EQ,
		//    value1: oData.Centro // centro
		//  }));
		//  // llamar al value help gen�rico
		//  this._openValueHelp('ENTREGA_PICKING_ENT_SALIDA_VTAS', aFilters, function (oObject) {
		//    // en oObject viene un objeto con {key: xxx, descripcion: xxx}
		//    oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Entrega", oObject.key);
		//    that.onSubmit_Entrega_EntregaPedidoVentasPickingEntregaSalida("", oObject.key);
		//  });

		// },

		/* Value help de almacen (posicion) */
		onValueHelp_EntregaPedidoVentasPickingEntregaSalida_Almacen: function(oEvent) {
			var aFilters = [];
			var oAppModel = this.getView().getModel("appModel");
			var sPath = oEvent.getSource().getBindingContext("appModel").getPath();
			var that = this;
			var oData = oAppModel.getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");

			var centroUsuario = oData.Centro; //this.getView().getModel("appModel").getProperty("/UserConfig/WRK/Parva");
			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: centroUsuario
			}));

			// llamar al value help gen�rico
			this._openValueHelp('ALMACEN', aFilters, function(oObject) {
				// en oObject viene un objeto con {key: xxx, descripcion: xxx}
				// setear almac�n a nivel posici�n
				oAppModel.setProperty(sPath + "/Lgort", oObject.key);

				that.onSubmit_Almacen_EntregaPedidoVentasPickingEntregaSalida(null, sPath);
			});

		},

		/* Valida que la cantidad pickeada de cada posici�n coincida con la requerida */
		onValidaciones_EntregaPedidoVentasPickingEntregaSalida: function() {
			var bValidado = true;
			var oData = this.getView().getModel("appModel").getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");

			// validar que haya pickeado todas las ump de todas las posiciones y que la cantidad coincida con el total
			var bFaltaPickearPosicion = false;
			// y que todas tengan completo lote y almacen
			var bFaltanDatosPosicion = false;
			var pesoBrutoTotal = 0;
			var pesoNetoTotal = 0;
			// if(oData.PesoBrutoTotal){
			//  pesoBrutoTotal = oData.PesoBrutoTotal;
			// };
			// if(oData.PesoNetoTotal){
			//  pesoNetoTotal = oData.PesoNetoTotal;
			// };
			for (var i in oData.ListaPosiciones) {
				var oPos = oData.ListaPosiciones[i];
				if (oPos.Kostk !== "C") {
					if (oPos.CantPickeada < parseFloat(oPos.Lfimg) || oPos.FaltaPickear) {
						bFaltaPickearPosicion = true;
					}
					if (!oPos.Lgort) {
						bFaltanDatosPosicion = true;
					}
					//BEGIN - DGOMEZ - 04.02.2022
					//Si se pas� de la cantidad, tambi�n marcar el flag
					if (oPos.CantPickeada > parseFloat(oPos.Lfimg)) {
						bFaltaPickearPosicion = true;
					}
					//END   - DGOMEZ - 04.02.2022
				}
				if (oPos.PesoBrutoAcum) {
					pesoBrutoTotal += parseFloat(oPos.PesoBrutoAcum);
				};
				if (oPos.PesoNetoAcum) {
					pesoNetoTotal += parseFloat(oPos.PesoNetoAcum);
				}
			}
			this.getView().getModel("appModel").setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/PesoBrutoTotal", pesoBrutoTotal);
			this.getView().getModel("appModel").setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/PesoNetoTotal", pesoNetoTotal);

			if (!oData.Entrega || bFaltaPickearPosicion || bFaltaPickearPosicion) {
				bValidado = false;
			}

			// setear el estado de validaci�n para habilitar el bot�n
			this.getView().getModel("appModel").setProperty("/EntregaPedidoVentasPickingEntregaSalida/Validado", bValidado);

			return bValidado;
		},

		/* Submit del input de almacen, reinicia lista de UMp */
		onSubmit_Almacen_EntregaPedidoVentasPickingEntregaSalida: function(oEvent, pPathPosicion) {
			// al cambiar el almacen se reinician las UMp pickeadas, porque hay que traerlas de SAP nuevamente para este almacen
			var sPathPosicion;
			if (oEvent) {
				sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			} else {
				sPathPosicion = pPathPosicion;
			}
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/ListaUMp", {});
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/UMpCargadas", false);
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/FaltaPickear", true);
			this.getView().getModel("appModel").setProperty(sPathPosicion + "/CantPickeada", 0);
		},

		/* Submit de input de entrega, carga lista de posiciones */
		onSubmit_Entrega_EntregaPedidoVentasPickingEntregaSalida: function(oEvent, oEntrega) {
			var entrega;
			if (oEvent) {
				entrega = oEvent.getParameter("value");
			} else {
				entrega = oEntrega;
			}

			var oAppModel = this.getView().getModel("appModel");
			var almacenProdTerm = oAppModel.getProperty("/AlmacenProdTerm");

			// Obtener la cabecera y posiciones de la entrega
			var aFilter = [];
			aFilter.push(new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, entrega));
			var that = this;
			this.getView().getModel().read("/DELI_DETAILSet", {
				filters: aFilter,
				success: function(oData) {
					var oListaPosiciones = {};
					for (var i = 0; i < oData.results.length; i++) {
						var item = oData.results[i];

						// cabecera de la entrega
						oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Vstel", item.Vstel);
						oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Lfdat", item.Lfdat);
						oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Werks", item.WerksSum);
						oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/Lifex", item.Lifex);
						oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/KunnrName", item.KunnrName);

						// cabecera, posiciones y UMp vienen todas juntas, descomprimir: 
						if (!oListaPosiciones[item.Posnr]) {
							// agregar nueva posicion
							oListaPosiciones[item.Posnr] = {
								Posnr: item.Posnr,
								Werks: item.Werks,
								Lgort: item.Lgort || almacenProdTerm,
								Matnr: item.Matnr,
								Arktx: item.Arktx,
								Lfimg: item.Lfimg,
								Meins: item.Vrkme, // unidad de venta
								Charg: item.Charg,
								Pikmg: item.Pikmg,
								Kostk: item.Kostk, // indicador contabilizada, C= contabilizada
								CantPickeada: 0,
								FaltaPickear: true,
								UMpCargadas: false, // marca si hicimos el read a OUT_DELI_GM_HUSet para llenar ListaUMp
								ListaUMp: {}
							};
						}
					}
					oAppModel.setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/ListaPosiciones", oListaPosiciones);
					that.onValidaciones_EntregaPedidoVentasPickingEntregaSalida();
				},
				error: function() {
					// limpiar los datos de la entrega
					this._onLimpiarPantalla(null, "EntregaPedidoVentasPickingEntregaSalida");
					MessageBox.error("No se encontr� informaci�n para la entrega elegida");
				}.bind(this)
			})
		},

		/* Mostrar popup de pickeo con las HU *disponibles* para una posici�n */
		onVerUHs_UMp_EntregaPedidoVentasPickingEntregaSalida: function(oEvent) {
			var oAppModel = this.getView().getModel("appModel");
			var aFilters = [];
			var sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			var oPosicion = oAppModel.getObject(sPathPosicion);

			aFilters.push(new Filter({
				path: 'Werks',
				operator: FilterOperator.EQ,
				value1: oPosicion.Werks
			}));

			if (!oPosicion.Lgort) {
				sap.m.MessageToast.show("Seleccione un almac�n");
				return;
			}

			aFilters.push(new Filter({
				path: 'Lgort',
				operator: FilterOperator.EQ,
				value1: oPosicion.Lgort
			}));

			aFilters.push(new Filter({
				path: 'Matnr',
				operator: FilterOperator.EQ,
				value1: oPosicion.Matnr
			}));
			var that = this;
			if (!oPosicion.UMpCargadas) {

				// cargar las UMp disponibles para la posici�n por material / centro / almac�n
				this.getView().getModel().read("/OUT_DELI_GM_HUSet", {
					filters: aFilters,
					success: function(oData) {

						if (oData.results.length < 1) {
							MessageBox.error(that.oTextos.getText("ump_no_disponible"));
							return;
						}
						var oListaUMp = {};
						var aPromises = [];
						// agregar las UMp a la lista de UMp de la posici�n
						for (var item of oData.results) {
							oListaUMp[item.Exidv] = {
								Venum: item.Venum,
								Matnr: item.Matnr,
								Arktx: item.Arktx || item.Matnr,
								Vepos: item.Vepos,
								Vemng: item.Vemng,
								Exidv: item.Exidv,
								Lfimg: item.Vemng,
								Charg: item.Charg,
								Lgort: item.Lgort,
								Vemeh: item.Vemeh,
								Brgew: item.Brgew,
								Ntgew: item.Ntgew,
								ListaUMp: [], // en caso de tener hijos los cargamos ac�
								Pickeado: false, // esto se va actualizando a medida que pickea cosas
								Exidv2: item.Exidv2 //DGOMEZ - 18.01.2022
							}

							// agregar la busqueda de hijos al array de promesas
							//if(aPromises.length < 51){
							//aPromises.push(this._getUmpSap(item.Exidv));
							//}
							// if(aPromises.length == 50){
							//  break;
							// }

						}

						// y a su vez, ir a buscar el detalle de cada una porque pueden tener ump "hijos"
						/*Promise.all(aPromises).then((aPromiseResults) => {

						  for (var aUmp of aPromiseResults) {
						    for (var i in aUmp) {
						      if (aUmp[i].ExidvSup) {
						        // agregar solo si es hijo
						        oListaUMp[aUmp[i].ExidvSup].ListaUMp.push(aUmp[i]);
						      } else {
						        // completar el lote
						        oListaUMp[aUmp[i].Exidv].Charg = aUmp[i].Charg;
						      }
						    }
						  }

						  oAppModel.setProperty(sPathPosicion + "/ListaUMp", oListaUMp);
						  oAppModel.setProperty(sPathPosicion + "/UMpCargadas", true);
						  oAppModel.setProperty(sPathPosicion + "/PesosVisible", true);


						})
						  .catch((e) => {
						    MessageBox.error(this.oTextos.getText("ump_no_disponible_error"));
						  });
						  */
						oAppModel.setProperty(sPathPosicion + "/ListaUMp", oListaUMp);
						oAppModel.setProperty(sPathPosicion + "/UMpCargadas", true);
						oAppModel.setProperty(sPathPosicion + "/PesosVisible", true);
						//Marcelo Medina - picking parameters
						oAppModel.setProperty("/currentPosition", oPosicion);
						// Abrir popup de pickeo
						this._popupPickeo(sPathPosicion, this.onValidaciones_EntregaPedidoVentasPickingEntregaSalida);
					}.bind(this),
					error: function(error) {
						MessageBox.error(this.oTextos.getText("ump_no_disponible_error"));
					}.bind(this),
				});

			} else {
				// Abrir popup de pickeo
				this._popupPickeo(sPathPosicion, this.onValidaciones_EntregaPedidoVentasPickingEntregaSalida);
			}

		},
		//Guardar
		/* Acci�n principal de la operaci�n EntregaPedidoVentasPickingEntregaSalida (Grabar) */
		onAccionPrincipal_EntregaPedidoVentasPickingEntregaSalida: function() {
			// Create con lo que haya cargado en appModel>/EntregaPedidoVentasPickingEntregaSalida/Datos
			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");

			if (!this.onValidaciones_EntregaPedidoVentasPickingEntregaSalida()) {
				return;
			}

			var oRequest = {
				Vbeln: oData.Entrega,
				Cont: oData.Contabilizar ? "X" : "", // switch de contabilizar entrega
				Route: oData.Ruta,
				OutDeliGmCont_To_OutDeliContNav: [],
				OutDeliGmCont_To_OutDeliContHuNav: []
			};

			if (!oData.Contabilizar) {
				for (var i in oData.ListaPosiciones) {
					var oPos = oData.ListaPosiciones[i];

					// posiciones
					oRequest.OutDeliGmCont_To_OutDeliContNav.push({
						Vbeln: oData.Entrega,
						Posnr: oPos.Posnr,
						Pikmg: oPos.Lfimg
					});

					// HU
					for (var j in oPos.ListaUMp) {
						var oUmp = oPos.ListaUMp[j];
						if (oUmp.Pickeado) {

							if (oUmp.ListaUMp.length > 0) {
								// si tiene hijos, se mandan solo los hijos
								for (var oUmpHijo of oUmp.ListaUMp) {
									oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
										Vbeln: oData.Entrega,
										Posnr: oPos.Posnr,
										Exidv: oUmpHijo.Exidv,
										Charg: oUmpHijo.Charg,
										Vemng: oUmpHijo.Vemng,
										Vemeh: oUmpHijo.Vemeh,
										Lgort: oUmpHijo.Lgort
									});
								}
							} else {
								// solo UMP principal
								oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
									Vbeln: oData.Entrega,
									Posnr: oPos.Posnr,
									Exidv: oUmp.Exidv,
									Charg: oUmp.Charg,
									Vemng: oUmp.Vemng,
									Vemeh: oUmp.Vemeh,
									Lgort: oUmp.Lgort
								});

							}
						}
					}

					// /* Contar las HU pickeadas para esta posicion: 
					//  si es 1, se mandan los datos de lote en la posic�n,
					//  si >1, se mandan en estructura aparte
					// */
					// var cantUmpPickeadas = 0;
					// var oUMpPickeada;
					// for (var j in oPos.ListaUMp) {
					//  var oUMp = oPos.ListaUMp[j];
					//  if (oUMp.Pickeado) {
					//    cantUmpPickeadas++;
					//    oUMpPickeada = oUMp;
					//  }
					// }

					// // HU
					// if (cantUmpPickeadas > 1) {
					//  // posicion
					//  oRequest.OutDeliGmCont_To_OutDeliContNav.push({
					//    Vbeln: oData.Entrega,
					//    Posnr: oPos.Posnr,
					//    Pikmg: oPos.Lfimg,
					//  });
					//  // >1 HU, cargar estructura aparte
					//  for (var j in oPos.ListaUMp) {
					//    var oUMp = oPos.ListaUMp[j];
					//    if (oUMp.Pickeado) {
					//      oRequest.OutDeliGmCont_To_OutDeliContHuNav.push({
					//        Vbeln: oData.Entrega,
					//        Posnr: oPos.Posnr,
					//        // Lgort: oUMp.Lgort,
					//        Charg: oUMp.Charg,
					//        Exidv: oUMp.Exidv,
					//        Vemng: oUMp.Vemng,
					//        Vemeh: oUMp.Vrkme
					//      });
					//    }
					//  }
					// } else {
					//  // 1 HU, cargar en la posicion
					//  oRequest.OutDeliGmCont_To_OutDeliContNav.push({
					//    Vbeln: oData.Entrega,
					//    Posnr: oPos.Posnr,
					//    Pikmg: oPos.Lfimg,
					//    Charg: oUMpPickeada.Charg,
					//    Lgort: oUMpPickeada.Lgort
					//  });
					// }
				}
			}
			var that = this;
			this.getView().getModel().create("/OUT_DELI_GM_CONTSet", oRequest, {
				success: function(oData, oResponse) {
					if (oResponse.statusCode === 201) {
						MessageBox.success(that.oTextos.getText("EntregaPedidoVentasPickingEntregaSalida_success"));

						if (oRequest.Cont) {
							// limpiar los datos de este objeto del modelo, solo despu�s de contabilizar, no en pasos intermedios
							that._onLimpiarPantalla(null, "EntregaPedidoVentasPickingEntregaSalida");
						} else {
							// poner kostk = C para que la tome como contabilizada en cada posicion
							var aListaPosiciones = that.getView().getModel("appModel").getProperty(
								"/EntregaPedidoVentasPickingEntregaSalida/Datos/ListaPosiciones");
							for (var i in aListaPosiciones) {
								aListaPosiciones[i].Kostk = "C";
							}
							that.getView().getModel("appModel").setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/ListaPosiciones",
								aListaPosiciones);
						}
						return
					}
					var aMessages = [];
					var oSapMessage = JSON.parse(oResponse.headers["sap-message"]);
					// no se sabe que es oSapMessage, pasar siempre a array
					if (Array.isArray(oSapMessage)) {
						aMessages = oSapMessage;
					} else {
						// no es array
						aMessages.push(oSapMessage);
					}

					var bError = false;
					// determinar si hubo al menos 1 error
					for (var index in aMessages) {
						var item = aMessages[index];
						if (item.severity !== "success") {
							bError = true;
						}
					}

					that._addHeaderMessages(aMessages, "EntregaPedidoVentasPickingEntregaSalida");

					// mostrar el mensaje que corresponda, si es error abrir el popover de mensajes
					if (bError) {
						MessageBox.error(that.oTextos.getText("error_verifique_log"));
						that._openMessagePopover();
					} else {
						MessageBox.success(that.oTextos.getText("EntregaPedidoVentasPickingEntregaSalida_success"));

						if (oRequest.Cont) {
							// limpiar los datos de este objeto del modelo, solo despu�s de contabilizar, no en pasos intermedios
							that._onLimpiarPantalla(null, "EntregaPedidoVentasPickingEntregaSalida");
						} else {
							// poner kostk = C para que la tome como contabilizada en cada posicion
							var aListaPosiciones = that.getView().getModel("appModel").getProperty(
								"/EntregaPedidoVentasPickingEntregaSalida/Datos/ListaPosiciones");
							for (var i in aListaPosiciones) {
								aListaPosiciones[i].Kostk = "C";
							}
							that.getView().getModel("appModel").setProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos/ListaPosiciones",
								aListaPosiciones);
						}

					}

				},
				error: that._errorOdata
			})
		},
		onAjustarCantidad_EntregaPedidoVentasPickingEntregaSalida: async function(oEvent) {

			var that = this;
			var oData = this.getView().getModel("appModel").getProperty("/EntregaPedidoVentasPickingEntregaSalida/Datos");
			var oObject = oEvent.getSource().getParent().getBindingContext("appModel").getObject();

			if (oObject.CantPickeada > 0) {

				var oRequest = {
					Vbeln: oData.Entrega,
					Posnr: oObject.Posnr,
					DlvQty: oObject.CantPickeada.toString()
				};

				try {
					var oResultado = await this.actualizar("/AJUSTE_QTYSet", oRequest);
					var bError = false;
					oObject.Lfimg = oObject.CantPickeada.toString();
					oObject.FaltaPickear = false;
					this.onValidaciones_EntregaPedidoVentasPickingEntregaSalida();
					MessageBox.success("Cantidad ajustada exitosamente")
					this.getView().getModel("appModel").refresh();
				} catch (error) {
					this._errorOdata(error);
				};

			} else {
				MessageBox.error("Cantidad pickeada debe ser mayor a 0");

			}

		},
		/********************  Fin EntregaPedidoVentasPickingEntregaSalida *****************************************************************************/

		/********************  Inicio M�todos gen�ricos *****************************************************************************************/
		/* Abrir un valuehelp generico (configurado en models.js) 
		Recibe:
		  - ID del valuehelp, que se corresponde con la clave usada en models.js ('ALMACEN')
		  - array de Filter
		  - funci�n que se llama cuando el usuario selecciona un objeto, retorna {key: xxx, descripcion: xxx }
		*/
		_openValueHelp: function(sValueHelpId, aFilters, fnCallback) {
			var oData = this.getView().getModel("valuehelpModel").getData();
			var oConfig = oData[sValueHelpId];
			if (!oConfig) {
				return;
			}

			this.getView().setBusy(true);

			// destruirlo si ya exist�a
			if (this._oValueHelpDialog) {
				this._oValueHelpDialog.destroy();
			}

			this._oValueHelpDialog = sap.ui.xmlfragment(oConfig.Fragment, this);
			this.getView().addDependent(this._oValueHelpDialog);
			var oFilterBar = this._oValueHelpDialog.getFilterBar();
			oFilterBar.setFilterBarExpanded(true);

			this.oColModel = new JSONModel({
				cols: oConfig.Columns
			});

			this._oValueHelpDialog.getTableAsync().then(function(oTable) {
				oTable.setModel(this.getView().getModel());
				oTable.setModel(this.oColModel, "columns");

				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/" + oConfig.EntitySet,
						filters: aFilters
					});
				}

				if (oTable.bindItems) {
					oTable.bindAggregation("items", {
						path: "/" + oConfig.EntitySet,
						filters: aFilters,
						factory: function() {
							return new ColumnListItem({
								cells: oConfig.Columns.map(function(column) {
									return new Label({
										text: "{" + column.template + "}"
									});
								})
							});
						}
					});
				}

				this._oValueHelpDialog.update();
			}.bind(this));

			// bindearlo a la configuraci�n seleccionada
			this._oValueHelpDialog.bindElement("valuehelpModel>/" + sValueHelpId);

			// setearle la funcion de callback para que la llame cuando el usuario seleccione algo en onValueHelpOkPress
			this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/Callback", fnCallback);

			// setearle los filtros iniciales
			this.getView().getModel("valuehelpModel").setProperty("/" + sValueHelpId + "/aFilters", aFilters || []);

			this.getView().setBusy(false);
			this._oValueHelpDialog.open();
		},

		/* Al seleccionar un elemento de un valuehelp generico */
		onValueHelpOkPress: function(oEvent) {
			if (oEvent.getParameter("tokens").length > 0) {
				// llamar a la funci�n de callback para que haga algo con la key y descripcion seleccionada
				var key = oEvent.getParameter("tokens")[0].getProperty("key");
				var descripcion = oEvent.getParameter("tokens")[0].getProperty("text");
				var oObject = oEvent.getSource().getBindingContext("valuehelpModel").getObject();
				oObject.Callback({
					key: key,
					descripcion: descripcion
				});
			}

			oEvent.getSource().close();

		},

		/* Al cerrar un valuehelp generico */
		onValueHelpCancelPress: function(oEvent) {
			oEvent.getSource().close();
		},

		/* Despu�s de cerrar un valuehelp se destruye violentamente */
		onValueHelpAfterClose: function(oEvent) {
			oEvent.getSource().destroy();
		},

		/* Al usar filtros en un valuehelp generico */
		onValueHelpFilter: function(oEvent) {
			var aSelectionSet = oEvent.getParameter("selectionSet");

			// tomar los filtros iniciales
			var aFiltersOrig = oEvent.getSource().getBindingContext("valuehelpModel").getObject().aFilters;

			var aFiltersNew = aSelectionSet.reduce(function(aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.EQ,
						value1: oControl.getValue(),
						caseSensitive: false
					}));
				}

				return aResult;
			}, []);
			// var oFilter = new Filter({
			//  filters: aFiltersOrig.concat(aFiltersNew), // array con todos los filtros concatenados
			//  and: true
			// });

			var aFilters = aFiltersOrig.concat(aFiltersNew);

			var oValueHelpDialog = this._oValueHelpDialog;
			oValueHelpDialog.getTableAsync().then(function(oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(aFilters);
				}

				if (oTable.bindItems) {
					oTable.getBinding("items").filter(aFilters);
				}

				oValueHelpDialog.update();
			});
		},

		/*Retorna un codigo de barras o QR escaneado */
		escanearCodigo: async function(that) {
			var that = this;

			if (!that._oDialogScanner) {
				// eliminar el div
				var div = document.getElementById("idScannerDiv");
				if (div) {
					div.parentNode.removeChild(div);
				}

				that.scannerModel = new JSONModel({
					error: false,
					camaras: [],
					inicializado: false // controla el boton de cancelar
				});
				that.getView().setModel(that.scannerModel, "scannerModel");

				that._oDialogScanner = new sap.m.Dialog({
					title: that.oTextos.getText("escanear_qr_titulo"),
					type: "Message",
					content: [
						new sap.m.VBox({
							alignItems: sap.m.FlexAlignItems.Center,
							alignContent: sap.m.FlexAlignContent.Center,
							justifyContent: sap.m.FlexJustifyContent.Center,
							items: [
								new sap.ui.core.HTML({
									content: "<div id='idScannerDiv' class='center' style='width:" + (that.isPhone ? "300px" : "600px") +
										"'></video>",
									visible: "{= !${scannerModel>error} }",
								}),
							],
						}),
					],
					buttons: [
						new sap.m.Button({
							text: that.oTextos.getText("escanear_qr_cancelar"),
							enabled: "{scannerModel>inicializado}",
							press: function() {
								that._oDialogScanner.close();
								if (html5QrCode) {
									html5QrCode.stop();
								}
							},
						}),
					],
				});
				that.getView().addDependent(that._oDialogScanner);
				that._oDialogScanner.open();

				html5QrCode = new Html5Qrcode("idScannerDiv");

				var aCamaras = await Html5Qrcode.getCameras().catch(function(err) {});
				that.scannerModel.setProperty("/camaras", aCamaras);
			} else {
				that._oDialogScanner.open();
			}

			return new Promise(function(resolve, reject) {
				var camaras = that.scannerModel.getProperty("/camaras");
				if (!camaras || !camaras.length) {
					reject(that.oTextos.getText("escanear_error_camara"));
				}

				let oCameraConfig = {
					facingMode: "environment"
				};

				let oVideoConfig = {
					fps: 10,
					qrbox: that.isPhone ? 220 : 350
				};
				let cameraId = camaras[0].id;
				html5QrCode
					.start(oCameraConfig, oVideoConfig,
						(code) => {
							that._oDialogScanner.close();
							html5QrCode.stop();
							resolve(code); // resolver con el c�digo le�do
						},
						(error) => {}
					)
					.catch((err) => {
						reject(`Error al iniciar c�mara: ${err}`);
					});

				that.scannerModel.setProperty("/inicializado", true);
			});
		},

		/* Handler gen�rico para errores en create de odata */
		_errorOdata: function(oError) {
			var msg1, msg2;
			try {
				msg1 = oError.message;
				msg2 = oError.responseText
			} catch (e) {}

			MessageBox.error("Se ha producido un error: " + msg1, {
				details: msg2
			});
		},

		/* Recibe un codigo escaneado y retorna en una promesa un array de las ump obtenidas del odata */
		_getUmpSap: function(sCodigoEscaneado) {
			var that = this;
			var oAppModel = this.getView().getModel("appModel");
			var aFilters = [];
			aFilters.push(new Filter({
				path: 'Exidv',
				operator: FilterOperator.EQ,
				value1: sCodigoEscaneado
			}));

			const COMPLETAR_ALMACEN_ORIGEN = (function(oList) {
				var primer_elemento = oList[0];
				var no_completar = primer_elemento.Lgort != "";
				if (no_completar) return;

				var completo = oList.find(e => e.Lgort != "");
				if (!completo) return;
				oList[0].Lgort = completo.Lgort;
			});

			//Nueva funcionalidad validación de pickeo
			let oCurrentPosition = this.getView().getModel("appModel").getData().currentPosition;
			let filters = [
					new sap.ui.model.Filter("Exidv", sap.ui.model.FilterOperator.EQ, sCodigoEscaneado),
					new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, oCurrentPosition.Werks),
					new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.EQ, oCurrentPosition.Lgort),
					new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, oCurrentPosition.Matnr)
				]
				//let sURL = `/VALIDATE_PICKINGSet(Exidv='${sCodigoEscaneado}',Werks='${oCurrentPosition.Werks}',Lgort='${oCurrentPosition.Lgort}',Matnr='${oCurrentPosition.Matnr}')`
			return new Promise(function(resolve, reject) {
				that.getView().getModel().read("/VALIDATE_PICKINGSet", {
					filters: filters,
					success: function(oData) {
						if (oData.results.length > 0) {
							COMPLETAR_ALMACEN_ORIGEN(oData.results);
							resolve(oData.results); // Esto es un array
						} else {
							reject("Sin resultados");
						}
					},
					error: function(oError) {

						reject(oError);
					}
				})
			});

			/*return new Promise(function (resolve, reject) {
			  that.getView().getModel().read("/HU_DETAILSet", {
			    filters: aFilters,
			    success: function (oData) {
			      if (oData.results.length > 0) {
			        COMPLETAR_ALMACEN_ORIGEN( oData.results );
			        resolve(oData.results); // Esto es un array
			      } else {
			        reject("Sin resultados");
			      }
			    },
			    error: function (oError) {
			      reject(oError);
			    }
			  })
			});*/
		},

		/* Navegaci��n interna a la pagina que coincide con la key */
		_internNavTo: function(oKey) {
			this.byId("idPageContainer").to(this.getView().createId(oKey));

			// si es mobile hay que ocultar el menu
			if (this.isPhone) {
				var oToolPage = this.byId("idToolPage");
				oToolPage.setSideExpanded(false);
			}

			// obtener titulos de la operacion
			var oOperacion = this.getView().getModel("appModel").getData()[oKey];
			// setear titulos globalmente
			if (oOperacion) {
				this.getView().getModel("appModel").setProperty("/Titulo", oOperacion.Titulo + " (((" + oKey + ")))");
				this.getView().getModel("appModel").setProperty("/Subtitulo", oOperacion.Subtitulo);
			} else {
				this.getView().getModel("appModel").setProperty("/Titulo", "");
				this.getView().getModel("appModel").setProperty("/Subtitulo", "");
			}
		},

		/* Limpiar la pantalla para la operaci�n actual */
		_onLimpiarPantalla: function(oEvent, sOperacion) {

			// pisarlo con el modelo limpio
			var oDataLimpio = models.createAppModel().getProperty("/" + sOperacion);
			this.getView().getModel("appModel").setProperty("/" + sOperacion, oDataLimpio);
			if (sOperacion == "TrasladoEntreAlmacenes2PasoConHUEntrada") {
				this.getView().byId("tblConBalanza").setVisible(false);
				this.getView().byId("tblSinBalanza").setVisible(false);
			}
		},
		/********************  Fin M�todos gen�ricos *****************************************************************************************/

		/********************  Inicio popover de mensajes ************************************************************************************/

		/* Crear popover de mensajes */
		initMessagePopover: function() {
			var oMessageTemplate = new MessageItem({
				type: '{messageModel>Type}',
				title: '{messageModel>Title}',
				activeTitle: false,
				description: '{messageModel>Message}',
				subtitle: '{messageModel>Timestamp}'
			});

			this._oMessagePopover = new MessagePopover({
				title: "Log de mensajes",
				items: {
					path: 'messageModel>/messages',
					sorter: {
						path: 'Timestamp',
						descending: true
					},
					template: oMessageTemplate
				}
			});
			this.byId("idMessagePopoverBtn").addDependent(this._oMessagePopover);
		},

		/* Mostrar popover de mensajes */
		onMessagePopoverPress: function(oEvent) {
			this._oMessagePopover.toggle(oEvent.getSource());
		},

		/* Abrir el popover de mensajes (por ejemplo al finalizar una operaci�n con errores) */
		_openMessagePopover: function() {
			this._oMessagePopover.openBy(this.getView().byId("idMessagePopoverBtn"));
		},

		/* Recibe un array de mensaje de bapiret2 y los agrega al modelo messageModel */
		_addBapiMessages: function(aNewMessages, sIdOperacion) {
			var oMessageModel = this.getView().getModel("messageModel");
			var aMessages = oMessageModel.getData();
			var maxPrioridad = "";
			var tituloOperacion = this.getView().getModel("appModel").getProperty("/" + sIdOperacion + "/Subtitulo");
			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				relative: true
			});

			const ENCONTRAR_SEVERITY = (function(mensaje) {
				try {
					var severity = aMessage.severity ? aMessage.severity : aMessage.Type;
					return severity;
				} catch (error) {
					return undefined;
				}
			});

			for (var i = 0; i < aNewMessages.length; i++) {
				var aMessage = aNewMessages[i];

				var severity = ENCONTRAR_SEVERITY(aMessage);
				switch (severity) {
					case "E":
						aMessage.Type = "Error";
						maxPrioridad = "Error";
						break;
					case "W":
						aMessage.Type = "Warning";
						if (maxPrioridad !== "Error") {
							maxPrioridad = "Warning";
						}
						break;
					case "S":
						aMessage.Type = "Success";
						if (maxPrioridad !== "Error" && maxPrioridad !== "Warning") {
							maxPrioridad = "Warning";
						}
						break;
					default:
						aMessage.Type = "Information";
						if (maxPrioridad !== "Error" && maxPrioridad !== "Warning" && maxPrioridad !== "Success") {
							maxPrioridad = "Warning";
						}
				}
				aMessage.Timestamp = new Date().toLocaleString();
				aMessage.Title = tituloOperacion || "";
				aMessages.push(aMessage);
			}

			oMessageModel.setProperty("/messages", aMessages);
			oMessageModel.setProperty("/maxPrioridad", maxPrioridad);
			oMessageModel.setProperty("/counter", aNewMessages.length);
		},

		/* Recibe un array de mensaje de headers y los agrega al modelo messageModel 
		  code: "VL/311"
		  details: []
		  message: "  grabado"
		  severity: "success"
		  target: ""
		  transition: false
		*/
		_addHeaderMessages: function(aNewMessages, sIdOperacion) {
			var oMessageModel = this.getView().getModel("messageModel");
			var aMessages = oMessageModel.getData();
			var maxPrioridad = "";
			var tituloOperacion = this.getView().getModel("appModel").getProperty("/" + sIdOperacion + "/Subtitulo");
			var oDateFormat = sap.ui.core.format.DateFormat.getInstance({
				relative: true
			});
			for (var i = 0; i < aNewMessages.length; i++) {
				var aMessage = aNewMessages[i];
				switch (aMessage.severity) {
					case "error":
						aMessage.Type = "Error";
						maxPrioridad = "Error";
						break;
					case "warning":
						aMessage.Type = "Warning";
						if (maxPrioridad !== "Error") {
							maxPrioridad = "Warning";
						}
						break;
					case "success":
						aMessage.Type = "Success";
						if (maxPrioridad !== "Error" && maxPrioridad !== "Warning") {
							maxPrioridad = "Warning";
						}
						break;
					default:
						aMessage.Type = "Information";
						if (maxPrioridad !== "Error" && maxPrioridad !== "Warning" && maxPrioridad !== "Success") {
							maxPrioridad = "Warning";
						}
				}
				aMessage.Timestamp = new Date().toLocaleString();
				aMessage.Title = tituloOperacion || "";
				aMessage.Message = aNewMessages[i].message;
				aMessages.push(aMessage);
			}

			oMessageModel.setProperty("/messages", aMessages);
			oMessageModel.setProperty("/maxPrioridad", maxPrioridad);
			oMessageModel.setProperty("/counter", aNewMessages.length);
		},

		/********************  Fin popover de mensajes ***************************************************************************************/

		/********************  Inicio popup de pickeo de HU ***************************************************************************************/

		/* Abrir el popup para la posici�n de entrega indicada en sPath */
		_popupPickeo: function(sPathPosicion, fnValidaciones, bForzar) {
			if (!this._oPopupPickeo) {
				this._oPopupPickeo = sap.ui.xmlfragment("ipesa.zradiofrecuenciaV2.view.fragments.PopupPickeoUMp", this);

				this.getView().addDependent(this._oPopupPickeo);
			}

			this._oPopupPickeo.bindElement("appModel>" + sPathPosicion);

			if (bForzar) {
				// guardar flag para no validar UMp contra listado de UMp de la pos
				this.getView().getModel("appModel").setProperty(sPathPosicion + "/bForzar", true);
			}

			// ejecutar validaciones
			this._oPopupPickeo.attachAfterClose(null, fnValidaciones, this);

			this._oPopupPickeo.open();

		},

		onClose_PopupPickeo: function(oEvent) {
			this._oPopupPickeo.close();
		},

		/* Submit de una ump ingresada manualmente en el popup de pickeo */
		onSubmit_UMp_PopupPickeo: function(oEvent) {
			var sCodigoIngresado = oEvent.getParameter("value");
			var sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			var oPosicion = this.getView().getModel("appModel").getObject(sPathPosicion);
			var oAppModel = this.getView().getModel("appModel");

			if (!sCodigoIngresado) {
				MessageToast.show(this.oTextos.getText("ump_error_vacio"));
				return;
			}

			var oSource = oEvent.getSource();

			if (oPosicion.UMpCargadas) {
				// Para este caso las UMp se validan contra la lista que hay precargada en ListaUMp

				//BEGIN - DGOMEZ - 18.01.2022
				//Si existe una clave en el objeto para el c�digo ingresado es una de las
				//posibilidades que este ingresando por el c�digo externo 2
				if (!oPosicion.ListaUMp[sCodigoIngresado]) {

					//Truncarle los ceros de adelante
					var sCodigoIngresadoFormateado = sCodigoIngresado.replace(/^0+/, '');

					//Buscar el c�digo externo 1 asociado al c�digo externo 2
					var oLinea = Object.entries(oPosicion.ListaUMp).find(([key, value]) => value.Exidv2 === sCodigoIngresadoFormateado);

					//Si se hizo match, asigno la clave
					if (oLinea) {
						sCodigoIngresado = oLinea[0]
					}

				}
				//END   - DGOMEZ - 18.01.2022

				// buscar en ListaUMp
				var ump = oPosicion.ListaUMp[sCodigoIngresado];
				if (ump) {
					var existe_lista = ump.ListaUMp instanceof Array;

					if (existe_lista) {
						// Si escanea
						if (ump.ListaUMp.length == 0) {
							this._getUmpSap(sCodigoIngresado).then((aUmp) => {
								// agregar la ump a la lista
								for (var i in aUmp) {
									if (aUmp[i].ExidvSup) {
										// agregar solo si es hijo
										ump.ListaUMp.push(aUmp[i]);
										// } else {
										//  // completar el lote
										//  oListaUMp[aUmp[i].Exidv].Charg = aUmp[i].Charg;
									}
								}
								// limpiar el input
								oSource.setValue("");
								//Posible validación Marcelo Medina
								if (aUmp[0].Valid) {
									this.agregarUmp_PopupPickeo([ump], sPathPosicion);
								} else {
									MessageBox.error(this.oTextos.getText("ump_invalida"));
								}
							}).catch((error) => {
								MessageBox.error(this.oTextos.getText("ump_invalida"));
							});
							//this.agregarUmp_PopupPickeo([ump], sPathPosicion);
						} else {
							this.agregarUmp_PopupPickeo([ump], sPathPosicion);
						}
					} else {
						this.agregarUmp_PopupPickeo([ump], sPathPosicion);
					}
					// agregar la ump a la lista, se manda como array ya que es una sola

					// limpiar el input
					oSource.setValue("");
				} else {
					this._getUmpSap(sCodigoIngresado).then((aUmp) => {
						var oData = aUmp[0];
						var oListaUMp = oAppModel.getProperty(sPathPosicion + "/ListaUMp");
						oListaUMp[oData.Exidv] = {
							Venum: oData.Venum,
							Matnr: oData.Matnr,
							Arktx: oPosicion.Matnr,
							Vepos: oData.Vepos,
							Vemng: oData.Vemng,
							Exidv: oData.Exidv,
							Lfimg: oData.Vemng, // para que funcione la suma de abajo, en general es con Lfimg
							Brgew: oData.Brgew,
							Ntgew: oData.Ntgew,
							Charg: oData.Charg,
							Vemeh: oData.Vemeh,
							ListaUMp: aUmp.filter(item => item.ExidvSup !== "") 
						}

						oAppModel.setProperty(sPathPosicion + "/ListaUMp", oListaUMp);
						// agregar la ump a la lista
						this.agregarUmp_PopupPickeo(aUmp, sPathPosicion);
						// limpiar el input
						oSource.setValue("");
					}).catch((error) => {
						MessageBox.error(this.oTextos.getText("ump_invalida"));
					});
					//MessageBox.error(this.oTextos.getText("ump_invalida"));
				}

			} else {
				// si no, se busca en SAP con el c�digo ingresado

				// llamar al odata
				this._getUmpSap(sCodigoIngresado).then((aUmp) => {
					// agregar la ump a la lista
					this.agregarUmp_PopupPickeo(aUmp, sPathPosicion);
					// limpiar el input
					oSource.setValue("");
				}).catch((error) => {
					MessageBox.error(this.oTextos.getText("ump_invalida"));
				});
			}

		},

		/* Escaneo de ump con la camara en popup de pickeo */
		onEscanear_UMp_PopupPickeo: function(oEvent) {
			var sPathPosicion = oEvent.getSource().getBindingContext("appModel").sPath;
			var oPosicion = this.getView().getModel("appModel").getObject(sPathPosicion);

			this.escanearCodigo(this)
				.then((sCodigoEscaneado) => {

					if (oPosicion.UMpCargadas) {
						// Para este caso las UMp se validan contra la lista que hay precargada en ListaUMp

						// buscar en ListaUMp
						var ump = oPosicion.ListaUMp[sCodigoIngresado];
						if (ump) {
							// agregar la ump a la lista
							//this.agregarUmp_PopupPickeo(ump, sPathPosicion);
							// limpiar el input
							//oSource.setValue("");
							var existe_lista = ump.ListaUMp instanceof Array;
							if (existe_lista) {
								if (ump.ListaUMp.length == 0) {
									this._getUmpSap(sCodigoIngresado).then((aUmp) => {
										// agregar la ump a la lista
										for (var i in aUmp) {
											if (aUmp[i].ExidvSup) {
												// agregar solo si es hijo
												ump.ListaUMp.push(aUmp[i]);
												// } else {
												//  // completar el lote
												//  oListaUMp[aUmp[i].Exidv].Charg = aUmp[i].Charg;
											}
										}
										// limpiar el input
										oSource.setValue("");
										this.agregarUmp_PopupPickeo([ump], sPathPosicion);
									}).catch((error) => {
										MessageBox.error(this.oTextos.getText("ump_invalida"));
									});
									//this.agregarUmp_PopupPickeo([ump], sPathPosicion);

								} else {
									this.agregarUmp_PopupPickeo([ump], sPathPosicion);
								}
							} else {
								this.agregarUmp_PopupPickeo([ump], sPathPosicion);
							}

						} else {
							MessageBox.error(this.oTextos.getText("ump_invalida"));
						}

					} else {
						// si no, se busca en SAP con el c�digo ingresado

						// llamar al odata
						this._getUmpSap(sCodigoEscaneado).then((aUmp) => {
							// agregar la ump a la lista
							this.agregarUmp_PopupPickeo(aUmp, sPathPosicion);
						}).catch((error) => {
							MessageBox.error(this.oTextos.getText("ump_invalida"));
						});
					}
				})
				.catch((error) => {
					// hacer algo con el error
					MessageBox.error(error || "No se ha podido acceder a la c�mara");
				});
		},

		/* Pickear UMp en popup de posici�n, la marca con Pickeada=true y recalcula cantidad total pickeada */
		agregarUmp_PopupPickeo: async function(aUmp, sPathPosicion) {
			//BEGIN - MORANO 11.02.2022
			var nDecimals = 3;
			//END - MORANO 11.02.2022

			//BEGIN - DGOMEZ 20.01.2022
			var sAppPath = sPathPosicion.split("/")[1];
			if (sAppPath === 'EntregaPedidoVentasPickingEntregaSalida') {
				nDecimals = 3;
			}
			//END   - DGOMEZ 20.01.2022
			var oAppModel = this.getView().getModel("appModel");
			var oListaUMp = oAppModel.getProperty(sPathPosicion + "/ListaUMp");
			var oPosicion = this.getView().getModel("appModel").getObject(sPathPosicion);
			//BEGIN - DGOMEZ 20.01.2022
			var cantPickeada = oPosicion.CantPickeada.toFixed(nDecimals);
			//END   - DGOMEZ 20.01.2022 f
			var cant_pendiente_sin_formato = parseFloat(oPosicion.Lfimg) - parseFloat(cantPickeada);
			var cantPendiente = cant_pendiente_sin_formato.toFixed(nDecimals);
			cantPendiente = Number(cantPendiente);

			// totalizar la cantidad, tomando como base la HU superior
			var ump = aUmp[0];
			var vemng = 0;
			for (var umpAux of aUmp) {
				let cantidad_sumar = parseFloat(umpAux.Vemng).toFixed(nDecimals);
				vemng += parseFloat(cantidad_sumar);
			}
			//BEGIN - DGOMEZ 20.01.2022
			//ump.Vemng = vemng.toFixed(2);
			ump.Vemng = vemng.toFixed(nDecimals);
			//END   - DGOMEZ 20.01.2022 
			// Begin Fnovo 
			var sRuta = sPathPosicion.split("/")[1];
			if (sRuta == 'TrasladoEntreCentrosPickingEntregaSalida' || sRuta == 'RecepcionTrasladosConHU') {
				var vemngAlte = 0;
				ump.Vemng = 0;
				for (var umpAux of aUmp) {
					let cantidad_sumar = parseFloat(umpAux.VemngAlte).toFixed(nDecimals)
					vemngAlte += parseFloat(cantidad_sumar);
				}
				ump.Vemng = vemngAlte.toFixed(nDecimals);
			}
			// End Fnovo
			if (!oPosicion.bForzar) {
				// la mayor�a de las operaciones tienen que validar contra la lista de UMp que viene de SAP
				// pero hay casos donde se agregan UMp desde cero con bForzar = true

				if (!oListaUMp || !ump.Exidv || !oListaUMp[ump.Exidv]) {
					// UMp pickeada no corresponde a esta posici�n
					MessageBox.error(this.oTextos.getText("ump_no_posicion", [ump.Exidv, oPosicion.Posnr]));
					return;
				}
				if (sRuta != 'EntregaPedidoVentasPickingEntregaSalida') {
					var cant_ya_agregada = Number(cantPickeada);
					var cant_pickeada = parseFloat(ump.Vemng).toFixed(nDecimals);
					var cant_max_necesitada = parseFloat(oPosicion.Lfimg).toFixed(nDecimals);
					var total_ingresado = cant_ya_agregada + parseFloat(cant_pickeada);
					total_ingresado = parseFloat(total_ingresado).toFixed(nDecimals);
					var supera_el_maximo = parseFloat(total_ingresado) > parseFloat(cant_max_necesitada);
					if (supera_el_maximo) {
						MessageBox.error(this.oTextos.getText("ump_excede_cant_posicion", [ump.Exidv, ump.Vemng, cantPendiente.toFixed(nDecimals)]));
						return;
					}
				}

			} else {
				// validar que coincida el material
				// if (ump.Matnr !== oPosicion.Matnr) {
				//  MessageBox.error(this.oTextos.getText("ump_no_material", [ump.Exidv, oPosicion.Posnr, oPosicion.Matnr]));
				//  return;
				// }
				// agregar la ump a la lista
				oListaUMp[ump.Exidv] = {
					Venum: ump.Venum,
					Matnr: ump.Matnr,
					Arktx: ump.Arktx,
					Vepos: ump.Vepos,
					Vemng: ump.Vemng,
					Exidv: ump.Exidv,
					Lfimg: ump.Vemng, // para que funcione la suma de abajo, en general es con Lfimg
					Brgew: ump.Brgew,
					Ntgew: ump.Ntgew
				}
			}

			// marcar la UMp como pickeada
			oListaUMp[ump.Exidv].Pickeado = true;
			oListaUMp[ump.Exidv].Vemng = ump.Vemng.toString();

			//Begin Fnovo

			if (sRuta == 'TrasladoEntreCentrosConPedidoPickingEntregaSalida') {

				if (!ump.Charg || ump.Charg == "") {
					var aFilters = [];

					aFilters.push(new Filter({
						path: 'IvMatnr',
						operator: FilterOperator.EQ,
						value1: oPosicion.Matnr
					}));

					aFilters.push(new Filter({
						path: 'IvWerks',
						operator: FilterOperator.EQ,
						value1: oPosicion.Werks
					}));

					aFilters.push(new Filter({
						path: 'IvLgort',
						operator: FilterOperator.EQ,
						value1: oPosicion.Lgort
					}));

					const modelo = this.getView().getModel();

					var oResponse = await new Promise(resolve => {
						modelo.read("/OUT_DELI_GM_HU_DETSet", {
							filters: aFilters,
							"success": async function(response, header) {
								resolve(response.results);
							},
							"error": function(response) {
								resolve([]);
							}
						});
					});
					var oLotes = [];
					for (var i = 0; i < oResponse.length; i++) {

						if (ump.Exidv == oResponse[i].Exidv) {

							oLotes.push({
								Charg: oResponse[i].Charg,
								Exidv: oResponse[i].Exidv,
								ExidvDet: oResponse[i].ExidvDet,
								Vemng: oResponse[i].Vemng,
								Vemeh: oResponse[i].Vemeh
							})
						}
					}
					oListaUMp[ump.Exidv].Lotes = oLotes;

				}

			}
			// End Fnovo
			// modificar la lista completa para que refresque los bindings
			oAppModel.setProperty(sPathPosicion + "/ListaUMp", oListaUMp);

			// actualizar cantidad a nivel posicion
			var bFaltaPickear = false;
			var cantPickeada = 0;
			var pesoBrutoAcumulado = 0;
			var pesoNetoAcumulado = 0;
			for (var i in oListaUMp) {
				var umpAux = oListaUMp[i];
				// sumar las cantidades pickeadas
				if (umpAux.Pickeado) {
					cantPickeada += parseFloat(umpAux.Vemng);
					pesoBrutoAcumulado += parseFloat(umpAux.Brgew);
					pesoNetoAcumulado += parseFloat(umpAux.Ntgew)
				}
			}

			var bFaltaPickear = false;
			if (cantPickeada < oPosicion.Lfimg) {
				bFaltaPickear = true;
			}

			//BEGIN - DGOMEZ 24.01.2022
			if (sAppPath === 'TrasladoEntreCentrosPickingEntregaSalida' || sAppPath === 'RecepcionTrasladosConHU') {
				if (Number(cantPickeada.toFixed(3)) >= oPosicion.Lfimg) {
					bFaltaPickear = false;
					cantPickeada = Number(cantPickeada.toFixed(3));
				}
			}
			//END   - DGOMEZ 24.01.2022

			oAppModel.setProperty(sPathPosicion + "/FaltaPickear", bFaltaPickear);
			oAppModel.setProperty(sPathPosicion + "/CantPickeada", cantPickeada);
			oAppModel.setProperty(sPathPosicion + "/PesoBrutoAcum", pesoBrutoAcumulado);
			oAppModel.setProperty(sPathPosicion + "/PesoNetoAcum", pesoNetoAcumulado);

			if (bFaltaPickear) {
				MessageToast.show(this.oTextos.getText("ump_pickeada", [ump.Exidv]));
			} else {
				MessageToast.show(this.oTextos.getText("ump_picking_completo"));
				this._oPopupPickeo.close();
			}

		},

		/* Desmarcar la UMp como pickeada y actualizar cantidades */
		borrarUmp_PopupPickeo: function(oEvent) {
			var oAppModel = this.getView().getModel("appModel");

			var sPathUMp = oEvent.getSource().getBindingContext("appModel").sPath;
			// marcar la UMp como no pickeada
			oAppModel.setProperty(sPathUMp + "/Pickeado", false);

			// recalcular
			var sPathPosicion = this._oPopupPickeo.getBindingContext("appModel").sPath;
			var oPosicion = oAppModel.getObject(sPathPosicion);
			var oListaUMp = oAppModel.getProperty(sPathPosicion + "/ListaUMp");

			var bFaltaPickear = false;
			var cantPickeada = 0;
			var pesoBrutoAcumulado = 0;
			var pesoNetoAcumulado = 0;
			for (var i in oListaUMp) {
				var ump = oListaUMp[i];
				// sumar las cantidades pickeadas
				if (ump.Pickeado) {
					cantPickeada += parseFloat(ump.Lfimg);
					pesoBrutoAcumulado += parseFloat(ump.Brgew)
					pesoNetoAcumulado += parseFloat(ump.Ntgew)
				}
			}

			var bFaltaPickear = false;
			if (cantPickeada < oPosicion.Lfimg) {
				bFaltaPickear = true;
			}
			oAppModel.setProperty(sPathPosicion + "/FaltaPickear", bFaltaPickear);
			oAppModel.setProperty(sPathPosicion + "/CantPickeada", cantPickeada);
			oAppModel.setProperty(sPathPosicion + "/PesoBrutoAcum", pesoBrutoAcumulado);
			oAppModel.setProperty(sPathPosicion + "/PesoNetoAcum", pesoNetoAcumulado);

			MessageToast.show(this.oTextos.getText("ump_eliminada", [ump.Exidv]));
		}

		/********************  Fin popup de pickeo de HU ***************************************************************************************/

	});

});