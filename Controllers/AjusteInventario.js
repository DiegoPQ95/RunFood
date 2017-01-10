	var app = angular.module('AjusteApp',['funciones'])
	.controller('ArticulosCtrl', ['$scope', 'localDb' ,'$location', function($scope,localDb, $location){
		var tipoAjuste = $location.search().ajuste;
		$scope.tipo = ( (tipoAjuste == 'egreso') ? '-' : '+' );
		var ctrl = this;
		localDb.init();
		this.lineas = [];
		this.detalle = [];



		this.agregarDetalle = function(art){
			if (art.cantidad > 0){
				art.cantidad += 1;
			}else{
				ctrl.detalle.push(art);
				art.cantidad +=1;
			}
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
		}

		this.limpiarDetalle = function(){
			if (ctrl.detalle.length > 0){
				if (confirm('Esta seguro de continuar?') == true ) {
					ctrl.detalle.forEach(function(art){
						art.cantidad = 0;
						ctrl.detalle = [];
					});
				}
			}
		}

		this.cantidadCambiada = function(articulo){
			if (isEmptyOrNull(articulo.cantidad)){
				articulo.cantidad = 0;
			}else{
				if (articulo.cantidad <= 0){
					ctrl.quitarDetalle(articulo);
				}
			}
		}

		this.guardar = function(){
			if (ctrl.detalle.length > 0 ){
				// LOGICA DE NEGOCIOS PARA ELIMINAR
				ctrl.tipo = $scope.tipo;
				var cabecera = {
					tipo : $scope.tipo,
					observacion : '',
					detalle : ctrl.detalle
				};
				localDb.ajuste.insert(cabecera, exito, error);
				function exito(ID, results){
					alert('Guardado con éxito');
					ctrl.estadoInicial();
				}
				function error(tx, results){
					alert('Error al guardar: ' + results.message)
				}
				console.log('AQUI VA A GUARDAR!')
			}
		}

		this.estadoInicial = function(){
			localDb.linea.get(function(lineas, response1){
				for (var i = 0; i < lineas.length; i++) {
					lineas[i].articulos = [];
				};
				localDb.articulo.getExistencias(function(articulos, response2){
					for (var i = 0; i < articulos.length; i++) {
						var iLinea = indexFromId( lineas ,articulos[i].idLinea);
						lineas[iLinea].articulos.push(articulos[i]);
					}
					ctrl.lineasArticulos = [];
					ctrl.lineasArticulos = lineas;
					$scope.$apply();
				}, function(tx2, error2){
					alert('Erro al cargar los articulos: ' + error2.message);
				});
			}, function(tx1, error1){
				alert('Error al cargar las lineas: ' + error1.message)
			});
			ctrl.detalle = [];
		}

		this.estadoInicial();

}]);
