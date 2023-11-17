sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createAppModel: function () {

			var oModel = new JSONModel();
			var oData = {
				UserConfig: {}, // configuracion del usuario
				Titulo: "Inicio", // Titulo de la operación seleccionada actualmente
				Subtitulo: "", // Subtitulo de la operación seleccionada actualmente
				AlmacenProdTerm: "0040", // almacen default para productos terminados
				AlmacenInsumos: "0010" // almacen default para insumos
			};

			// Pantalla de inicio
			oData.Home = {
				Titulo: "Inicio",
				Subtitulo: ""
			}

			// Vamos armando los datos requeridos en cada operación
			oData.TrasladoEntreAlmacenes1PasoSinHU = {
				Datos: {
					ClaseMovimiento: "311",
					Centro: "",
					Almacen: "",
					Material: "",
					Cantidad: "",
					CantidadUM: "",
					Lote: "",
					AlmacenDestino: ""
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Creacion Doc Mat. (trasp)",
				Subtitulo: "Op.: Traspaso Alm - 1 paso"
			}

			oData.TrasladoEntreAlmacenes2PasoSinHUSalida = {
				Datos: {
					ClaseMovimiento: "313",
					Centro: "",
					Almacen: "",
					Material: "",
					Cantidad: "",
					CantidadUM: "",
					Lote: "",
					AlmacenDestino: ""
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Creacion Doc Mat. (trasp)",
				Subtitulo: "Op.: Traspaso Alm - 2 pasos (salida)"
			}

			oData.TrasladoEntreAlmacenes2PasoSinHUEntrada = {
				Datos: {
					ClaseMovimiento: "315",
					Centro: "",
					Almacen: "",
					Material: "",
					Cantidad: "",
					CantidadUM: "",
					Lote: "",
					AlmacenDestino: ""
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Creacion Doc Mat. (trasp)",
				Subtitulo: "Op.: Traspaso Alm - 2 pasos (entrada)"
			}

			oData.TrasladoEntreAlmacenes1PasoConHU = {
				Datos: {
					ClaseMovimiento: "0006", //Aca no se pasa el movimiento sino el evento porque falla la BAPI
					AlmacenDestino: "",
					ListaUMp: {} // un listado de números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Creacion Doc Mat. (trasp)",
				Subtitulo: "Op.: 0006 Traspaso Alm - 1 paso"
			}

			oData.TrasladoEntreAlmacenes2PasoConHUSalida = {
				Datos: {
					ClaseMovimiento: "0011", //Aca no se pasa el movimiento sino el evento porque falla la BAPI
					AlmacenDestino: "",
					ListaUMp: {} // un listado de números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Creacion Doc Mat. (trasp)",
				Subtitulo: "Op.: 0011 Traspaso Alm - 2 pasos (salida)"
			}

			oData.TrasladoEntreAlmacenes2PasoConHUEntrada = {
				Datos: {
					ClaseMovimiento: "0012", //Aca no se pasa el movimiento sino el evento porque falla la BAPI
					AlmacenDestino: "",
					ListaUMp: {} // un listado de números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Creacion Doc Mat. (trasp)",
				Subtitulo: "Op.: 0012 Traspaso Alm - 2 pasos (entrada)"
			}

			oData.TrasladoEntreCentrosCreacionEntregaSalida = {
				Datos: {
					CentroDestino: "",
					AlmacenDestino: "",
					ListaUMp: {} // un listado de números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Creacion Entrega Salida",
				Subtitulo: "Op.: 0008 Traspaso de Ce a Ce (salida) "
			}

			oData.TrasladoEntreCentrosPickingEntregaSalida = {
				Datos: {
					Entrega: "",
					FechaEntrega: "",
					Contabilizar: false,
					ListaPosiciones: {}
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Picking Entrega Salida",
				Subtitulo: "Picking Entrega Salida"
			}

			oData.RecepcionTrasladosSinHU = {
				Datos: {
					Entrega: "",
					Vstel: "",
					Lfdat: "",
					Werks: "",
					Lifex: "",
					ListaPosiciones: {}
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Recepcion Traslados",
				Subtitulo: "Recepcion Traslados Sin HU"
			}

			oData.TrasladoEntreCentrosConPedidoCreacionEntregaSalida = {
				Datos: {
					Pedido: "",
					Vstel: "",
					FechaCreacion: new Date(),
					ListaPosiciones: {}
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Traslado entre centros con pedido",
				Subtitulo: "Crear entrega de salida con pedido de traslado"
			}

			oData.RecepcionTrasladosConHU = {
				Datos: {
					Entrega: "",
					Vstel: "",
					Lfdat: "",
					Werks: "",
					Lifex: "",
					ListaPosiciones: {}
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Recepcion Traslados",
				Subtitulo: "Recepcion Traslados Con HU"
			}

			oData.InventariosSinUmp = {
				Datos: {
					DocInventario: "",
					Centro: "",
					Almacen: "",
					PosDocInventario: "",
					Material: "",
					Lote: "",
					Cantidad: "",
					CantidadUM: ""
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Toma inventarios",
				Subtitulo: "Conteo de inv. sin UMp"
			}

			oData.InventariosConUmp = {
				Datos: {
					DocInventario: "",
					Centro: "",
					Almacen: "",
					ListaUMp: {} // un listado de números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Toma inventarios",
				Subtitulo: "Conteo de inv. con UMp"
			}

			oData.DesembalajeUmp = {
				Datos: {
					DesembalajeCompleto: false, 
					ListaUMp: {} // un listado de números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Repacking",
				Subtitulo: "Desembalaje UMp"
			}

			oData.RepackingUmpPallet = {
				Datos: {
					TipoRepack: "nuevo",
					ClaseMovimiento: "311",
					MaterialEmbalaje: "",
					UmpDestino: "",
					ListaUMp: {} // un listado de números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Repacking",
				Subtitulo: "Repacking UMp (pallet)"
			}

			oData.RepackingMaterial = {
				Datos: {
					ClaseMovimiento: "311",
					Centro: "",
					Material: "",
					MaterialEmbalaje: "",
					CantidadParcial: "",
					CantidadTotal: "",
					Lote: "",
					AlmacenDestino: "",
					EmbalarAuto: false
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Repacking",
				Subtitulo: "Repacking material"
			}

			oData.ConsultaUmp = {
				Datos: {
					Visible: false,
					Visible2: false,
					ListaUMp: {}
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Consultas",
				Subtitulo: "Consulta UMp"
			}
				
			oData.ConsultaLotes = {
				Datos: {
					Material: "",
					DescripcionMaterial:"",
					Lote: "",
					Centro: "",
					Almacen: "",
					CantidadUM: "",
					Disp: false,
					TablaUMp: {} // un listado con datos de los números que el usuario va escaneando: { 123: {ump: 123}, 456: {ump: 456} }
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Consultas",
				Subtitulo: "Consulta Lotes"
			}

			oData.ConsultaStock = {
				Datos: {
					Material: "",
					Centro: "",
					Almacen: "",
					MaterialDescripcion: "",
					LibreUtilizacion: "",
					EnTraslado: "",
					InspCalidad: "",
					Bloqueado: ""
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Consultas",
				Subtitulo: "Consulta Stock"
			}

			oData.TrasladoEntreCentrosConPedidoPickingEntregaSalida = {
				Datos: {
					Entrega: "",
					Vstel: "",
					Lfdat: "",
					Werks: "",
					Lifex: "",
					Contabilizar: false,
					ListaPosiciones: {}
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Trasl. e/ centros con ped.",
				Subtitulo: "Picking entrega salida"
			}

			oData.EntregaPedidoVentasPickingEntregaSalida = {
				Datos: {
					Entrega: "",
					Vstel: "",
					Lfdat: "",
					Werks: "",
					Lifex: "",
					Contabilizar: false,
					ListaPosiciones: {}
				},
				Validado: false, // controla la activación del botón de acción principal
				Titulo: "Entrega para ped. ventas",
				Subtitulo: "Picking entrega salida"
			}

			oModel.setData(oData);
			return oModel;

		},

		createValueHelpModel: function () {

			var oModel = new JSONModel();
			var oData = {};

			// Vamos armando la configuración de cada valuehelp
			oData.ALMACEN = {
				EntitySet: "F4_LGORTSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Almacen", // fragment con barra de filtros
				Columns: [{
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Almacén",
					"template": "Lgort"
				}, {
					"label": "Descripción",
					"template": "Lgobe"
				}]
			}
			
			
			oData.ALMACEN_CON_HU = {
				EntitySet: "F4_LGORT_INVSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Almacen", // fragment con barra de filtros
				Columns: [{
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Almacén",
					"template": "Lgort"
				}, {
					"label": "Descripción",
					"template": "Lgobe"
				}]
			}
			
			oData.ALMACENCENTRO = {
				EntitySet: "F4_LGORTSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.AlmacenCentro", // fragment con barra de filtros
				Columns: [{
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Almacén",
					"template": "Lgort"
				}, {
					"label": "Descripción",
					"template": "Lgobe"
				}]
			}

			oData.MATERIAL = {
				EntitySet: "F4_MATNRSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Material", // fragment con barra de filtros
				Columns: [{
					"label": "Material",
					"template": "Matnr"
				}, {
					"label": "Descripción",
					"template": "Maktg"
				}]
			}

			oData.CENTRO = {
				EntitySet: "F4_WERKSSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Centro", // fragment con barra de filtros
				Columns: [{
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Descripción",
					"template": "Name1"
				}, {
					"label": "Ciudad",
					"template": "City1"
				}, {
					"label": "CP",
					"template": "PostCode1"
				}]
			}

			oData.RUTA = {
				EntitySet: "F4_ROUTESet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Ruta", // fragment con barra de filtros
				Columns: [{
					"label": "Ruta",
					"template": "Route"
				}, {
					"label": "Descripción",
					"template": "Bezei"
				}]
			}

			oData.PUESTO_EXPED = {
				EntitySet: "F4_VSTELSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.PuestoExpedicion", // fragment con barra de filtros
				Columns: [{
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Almacén",
					"template": "Lgort"
				}, {
					"label": "Puesto exped.",
					"template": "Vstel"
				}]
			}

			oData.ENTREGA = {
					EntitySet: "F4_VBELNSet", // entityset sin la barra
					Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Entrega", // fragment con barra de filtros
					Columns: [{
						"label": "Entrega",
						"template": "Vbeln"
					}, {
						"label": "Puesto exped.",
						"template": "Vstel"
					}, {
						"label": "Clase entrega",
						"template": "Lfart"
					}, {
						"label": "Entrega externa",
						"template": "Lifex"
					}]
				},
				oData.ENTREGA_PICKING_ENT_SALIDA_VTAS = {
					EntitySet: "F4_VBELNSet", // entityset sin la barra
					Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Entrega", // fragment con barra de filtros
					Columns: [{
						"label": "Entrega",
						"template": "Vbeln"
					},
					// {
					// 	"label": "Fecha Plan SM",
					// 	"template": "{path: 'Wadat', formatter:'.formatter.formatDate'}"
					// },
					{
						"label": "Fecha Plan SM",
						"template": "FechaFormateada"
					},
					{
						"label": "Puesto exped.",
						"template": "Vstel"
					},
					{
						"label": "Material",
						"template": "Matnr"
					},
					{
						"label": "Destinatario",
						"template": "DestinatarioCompleto"		
					}
					]
				},
				oData.ENTREGA_RECEP_TRASLADOS = {
					EntitySet: "F4_VBELNSet", // entityset sin la barra
					Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Entrega", // fragment con barra de filtros
					Columns: [{
						"label": "Entrega",
						"template": "Vbeln"
					},
					
					{
						"label": "Fecha Plan SM",
						"template": "FechaFormateada"
					},
					{
						"label": "Punto Recep.",
						"template": "Vstel"
					},
					{
						"label": "Entrega externa",
						"template": "Lifex"
					},
					{
						"label": "Proveedor - Ce Sum",
						"template": "DestinatarioCompleto"		
					}
					]
				},			
			oData.PEDIDO = {
				EntitySet: "F4_EBELNSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Pedido", // fragment con barra de filtros
				Columns: [{
					"label": "Pedido",
					"template": "Ebeln"
				}, {
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Ce.suministrad.",
					"template": "Reswk"
				}]
			},

			oData.LOTE = {
				EntitySet: "F4_CHARGSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.Lote", // fragment con barra de filtros
				Columns: [{
					"label": "Almacen",
					"template": "Lgort"
				}, {
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Material",
					"template": "Matnr"
				},{
					"label": "Lote",
					"template": "Charg"
				},{
					"label": "Libre utiliz.",
					"template": "Clabs"
				},{
					"label": "UM Base",
					"template": "Meins"
				}]
			}

			oData.INVENTARIO_SIN_UMP = {
				EntitySet: "F4_INVSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.InventarioSinUMP", // fragment con barra de filtros
				Columns: [{
					"label": "Doc. inventario",
					"template": "Iblnr"
				}, {
					"label": "Ejercicio",
					"template": "Gjahr"
				}, {
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Almacén",
					"template": "Lgort"
				}, {
					"label": "Fecha recuento",
					"template": "Zldat"
				}]
			}

			oData.INVENTARIO_CON_UMP = {
				EntitySet: "F4_INV_HUSet", // entityset sin la barra
				Fragment: "ipesa.zradiofrecuenciaV2.view.valuehelps.InventarioConUMP", // fragment con barra de filtros
				Columns: [{
					"label": "Doc. inventario",
					"template": "Iblnr"
				}, {
					"label": "Centro",
					"template": "Werks"
				}, {
					"label": "Almacén",
					"template": "Lgort"
				}, {
					"label": "Fecha recuento",
					"template": "Zldat"
				}]
			}

			oModel.setData(oData);
			return oModel;

		}

	};
});