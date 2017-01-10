angular.module('pruebasApp',['funciones', 'formularioMantLinea'])
.controller('Control', ['$scope', function($scope){
	this.guardar = function(rows){
		console.log('LLEGARON', rows);
	}
}])