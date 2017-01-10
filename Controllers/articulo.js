var app = angular.module('ArticuloApp',['funciones', 'formularioMantLinea']);
app.controller('registroArticuloCtrl', ['$scope','localDb', function($scope,localDb){
	var yo = this;
	localDb.init();
	this.lineas = [];
	this.articulos = [];
	this.articulo = {};
	this.estadoInicial = function(){
		localDb.linea.get(
			function(arr, res){
				yo.lineas = arr;
			}, function(tx, res){
				alert('Error al cargar las lineas: ' + res.message);
			});
		yo.cargarArticulos();
		yo.nuevo();
	}
	this.actualizarLineas = function(arr){
		yo.lineas = arr;
		$scope.$apply();
	}

		this.cargarArticulos = function(){
			localDb.articulo.get(function(arr, response){
				yo.articulos = [];
				yo.articulos = arr;
				$scope.$apply();
			}, function(tx, response){
				alert('Error:'+ response.message + 'Por favor, actualize el listado de Articulos mas tarde.');
			})
		}

		this.guardar = function(){
			if (validarArticulo(yo.articulo) != undefined){
				yo.articulo.esComponente = (yo.idLinea == 1);
				if (yo.articulo.id > 0){
					localDb.articulo.update(yo.articulo,callback,error);
				}else{
					localDb.articulo.insert(yo.articulo,callback,error);
				}

				function callback(tx, results){
					alert('Guardado con exito');
					yo.estadoInicial()
				}
				function error(tx, res){
					alert('No se pudo guardar el articulo: ' + res.message);
				}
			}
					
		}


		this.nuevo = function(){
					yo.articulo = {descripcion : '',
					codigo : '',
					pvp1 : 0.0,
					idLinea : 1,
					pagaIva : false
				}
			}

	this.eliminar= function(){
		if (confirm("Esta seguro de borrar este registro?")){
			localDb.query('DELETE FROM ARTICULO WHERE id=?', [yo.articulo.id],
			function(tx, res){
				alert('Eliminado con exito');
				estadoInicial();
			}, function(tx, res){
				alert('Error: ' + res.message);
			})
		}
	}


	this.cargar = function(articulo){
		yo.articulo = articulo;
	}

	this.estadoInicial();

}]);
