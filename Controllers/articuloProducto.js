var app = angular.module('ArticuloProductoApp', ['funciones']);

app.controller('MantenimientoCtrl', ['$scope','localDb', function($scope,localDb){
	localDb.init();
	$scope.tipo = 'P';
	var yo = this;
	this.articuloProducto = {};
	this.componentes = [];
	this.articulosProducto = [];
	this.lineas = [];


// OPERTIVO

	this.agregarDetalle = function(comp){
		if (!comp.cantidad > 0){
			comp.cantidad = 1;
			yo.articuloProducto.componentes.push(comp);
		}else{
			comp.cantidad +=1
		}
	}

	this.quitarDetalle = function(comp){
			comp.cantidad -= 1
		if (!(comp.cantidad > 0)){
			yo.articuloProducto.componentes.splice(yo.articuloProducto.componentes.indexOf(comp), 1);
			comp.cantidad = 0;
		}
	}

	this.nuevo = function(){
		yo.articuloProducto = {
			descripcion : '',
			codigo : '',
			id : 0,
			pagaIva : true,
			pvp1: '',
			componentes : []
		}
	}

	this.guardar = function(){
		if (validarArticulo(yo.articuloProducto) != undefined){
			yo.articuloProducto.esComponente = 0;
			if (validarArticuloProducto(yo.articuloProducto) != undefined){
				yo.articuloProducto.tipo = $scope.tipo;
				if (yo.articuloProducto.id > 0 ){
					localDb.articuloProducto.update(yo.articuloProducto, exito, error)
				}else{
					localDb.articuloProducto.insert(yo.articuloProducto, exito, error)
				}
			}
		}
		function exito(ID, results){
			alert('Cambios guardados con exito');
			yo.estadoInicial();
		};
		function error(ID, error){
			alert('Error al guardar: ' + error.message);
			if (ID != undefined){	
				yo.articuloProducto.id = ID;
			};
		}

	}

	this.eliminar = function(){
		if (yo.articuloProducto.id > 0){
			try{
				localDb.articuloProducto.delete(yo.articuloProducto, exito, error)
				function exito(tx, results){
					alert('Eliminado con exito');
					yo.estadoInicial();
				}
				function error(tx, results){
					alert('Eror al eliminar: ' + results.message);
				}
			}catch(ex){
				alert(ex.message);
			}
		}
		console.log('VOY A ELIMINAR');
	}

	this.cargar = function(art){
		yo.articuloProducto = art;
	}
// OPERATIVO

// FUNCIONES COMPLEMENTARIAS

	this.estadoInicial = function(){
		// CARGAR PRODUCTOS
		var componentesInit = false;
		var registrosInit = false;
		localDb.articulo.get(success, error);
		function success(arr, results){
			yo.componentes = arr;
			componentesInit = true;
			askApply()
		};
		function error(tx, results){
			alert('Error al cargar los componentes: ' + results.message);
			componentesInit = true;
			askApply()
		};
		// CARGAR COMPONENTES
		localDb.articuloProducto.get(function(arr, results){
			yo.articulosProducto = arr;
			registrosInit = true;
			askApply();
		}, function(tx, results){
			alert('Error al cargar los registros: ' + results.message);
			registrosInit = true;
			askApply();
		});

		yo.cargarLineas();
		yo.nuevo();

		function askApply(){
			if( registrosInit == true && componentesInit == true){
				$scope.$apply();
			}
		}
	}

	this.cargarLineas = function(){
		localDb.query("SELECT * FROM LINEA", [],
		function(tx, result){
			yo.lineas = [];
			for (var i = 0; i < result.rows.length; i++) {
			yo.lineas.push(result.rows[i]);
			}
		}, function(tx, res){
				alert('Error al cargar Lineas: ' + res.message)}
		);
	}
	this.estadoInicial();
}]);


function validarArticuloProducto(artProd){
	var und = undefined;
	if (artProd.componentes.length == 0){
		alert('Debe seleccionar al menos un articulo.');
	}else{
		for (var i = 0; i < artProd.componentes.length; i++) {
			var comp = artProd.componentes[i];
			if (!(comp.cantidad > 0)){
				alert('El articulo ' + comp.descripcion + ' tiene que tener una cantidad.');
				return undefined;
			}else{
				und = true;
			}
		}
	}
	return und;
}