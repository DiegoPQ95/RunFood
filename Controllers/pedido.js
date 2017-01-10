var app = angular.module('PedidoApp', ['funciones', 'FormularioPago', 'frmImprimir']);

app.controller('PedidoCtrl', ['$scope','localDb', 'IFormularioPago', function($scope,localDb, IFormularioPago){
	var ctrl = this;
	$scope.pagar = true;
	$scope.comprobante = false;
	this.detalle = [];
	this.pagos = [];
	localDb.init();
	this.numero = 1;
	$('#frmPago').modal({ show: false});
	$('#frmImprimir').modal({show:false});

	function limpiar(){
		ctrl.detalle.forEach(function(art){
			art.cantidad = 0;
			ctrl.detalle = [];
		});
		ctrl.base0 = 0,
		ctrl.baseIva = 0;
		ctrl.iva = 0;
		ctrl.total = 0;
		ctrl.pagos = [];
		cargarNumeroPedido();
	}

	// FUNCIONAMIENTO DEL LISTADO
		this.agregarDetalle = function(art){
			if (art.cantidad > 0){
				art.cantidad += 1;
			}else{
				ctrl.detalle.push(art);
				art.cantidad +=1;
			}
			ctrl.calculoTotales();
		}

		this.restarDetalle = function(art){
			art.cantidad -= 1;
			ctrl.cantidadCambiada(art);
		}

		this.quitarDetalle = function(art){
			try{
					art.cantidad = 0;
					ctrl.detalle.splice( ctrl.detalle.indexOf(art), 1);
			}catch(e){
				console.log('Error en la funcion QuitarDetalle: ')
				console.log(e);
			}
			ctrl.calculoTotales();
		}

		this.cantidadCambiada = function(articulo){
			if (isEmptyOrNull(articulo.cantidad)){
				articulo.cantidad = 0;
			}else{
				if (articulo.cantidad <= 0){
					ctrl.quitarDetalle(articulo);
				}
			}
			ctrl.calculoTotales();
		}

		this.calculoTotales = function(){
			ctrl.base0 = 0;
			ctrl.baseIva = 0;
			ctrl.iva = 0;
			ctrl.total = 0;
			for (var i = 0; i < ctrl.detalle.length; i++) {
				var d = ctrl.detalle[i];
				if (d.cantidad > 0 ){
					if (d.pagaIva){
						ctrl.iva += d.subtotalIva();
						ctrl.baseIva += d.subtotal();
					}else{
						ctrl.baseIva += d.subtotal();
					}
				}
			}
			ctrl.base0 = round(ctrl.base0);
			ctrl.baseIva = round(ctrl.baseIva);
			ctrl.iva = round(ctrl.iva);
			ctrl.total = round(ctrl.base0 + ctrl.baseIva + ctrl.iva);
		}


		//FUNCIONAMIENTO DEL BOTON DE PRODUCTO: 		--- FUNCIONAMIENTO ESPECIAL HERE YA GO!
		var timer = null;

		this.press = function(articulo){
		  timer = setTimeout(doStuff, 1000 );
		  function doStuff(){
		  	clearTimeout(timer);
		  	alert('PRESIONASTE POR 1 SEGUNDO: ' + articulo.descripcion);
		  }
		};

		this.unPress = function(item){
			var tiempoHastaAqui = 0;
			tiempoHastaAqui = timer;
		  clearTimeout(timer);
		 if (timer < 1000){
		  	ctrl.agregarDetalle(item);
		  }
		};

		this.limpiar_click = function(){
			if (ctrl.detalle.length > 0){
				if (confirm('Esta seguro de continuar?') == true ) {
					limpiar();
				}
			}
		}

	this.guardar = function(){
		if (validarDetalle() ){
			IFormularioPago.inicializar(ctrl.detalle, ctrl.total, localDb.configuracion,pagoRegistrado, error);
			$('#frmPago').modal('show');
		}

		function pagoRegistrado(arr){
			$('#frmPago').modal('hide');
			var pedido = {
				estado : 'A',
				ordenante : ctrl.ordenante,
				base0 :ctrl.base0,
				baseIva : ctrl.baseIva,
				iva : ctrl.iva,
				total : ctrl.total,
				detalle: ctrl.detalle,
				pagos : arr
			};
			localDb.pedido.insert(pedido, ok, err);
		}

		function ok(tx, results, insertId){
			alert('Guardado con exito');
			//AQUI TENGO QUE PONER LA INTERFAZ DEL frmImprimir para manadarla para imprimir, o el objeto entero.
			// IfrmImprimir.pedido = pedido;
			// iFrmImprimir.inicializar(pedido);
			$('#frmImprimir').modal('show');
			ctrl.estadoInicial();
		}
		function err(tx, results){
			alert('Error al guardar: ' + results.message);
		}
		function error(message){
			alert('Ocurrio un error!, sorry :(');
		}
	}

	//ARTICULOS Y LINEAS //
	function cargarArticulos(){
		localDb.articulo.lineasArticulos(exito, error, true);
		function exito(arr, reults){
			ctrl.lineasArticulos = arr;
        	$scope.$apply();
		};
		function error(tx, results){
			alert('Error al cargar los articulos: ' + results.message);
		}
	}

	function cargarNumeroPedido(){
	localDb.pedido.getNumero(
		function(numero, results){
			ctrl.numero = numero;
		},
		function(tx, results){
			alert('Error al obtener el numero de pedido: ' + results.message);
		})
	}

	this.estadoInicial = function(){
		limpiar();
		cargarArticulos();
	}

	this.estadoInicial();

	// VALIDAR EL DETALLE
	function validarDetalle(){
		return true;
	}

}]);