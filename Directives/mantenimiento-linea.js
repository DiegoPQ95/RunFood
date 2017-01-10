angular.module('formularioMantLinea',['funciones'])
.controller('mantenimientoLineaCtrl', ['localDb', '$scope', function(localDb, $scope){
	$scope.rows = [];
	localDb.init();

	($("#frmMantLinea").data('bs.modal') || {isShown: false}).isShown

	function estadoInicial(){
		localDb.linea.getEstaEnUso(ok, no, true);
		function ok(arr, results){
			$scope.error = '';
			$scope.rows = [];
			for (var i = 0; i < arr.length; i++) {
				arr[i].enUso = (arr[i].enUso == 1);
				$scope.rows.push(arr[i])
			}
			$scope.$apply();
		}
		function no(tx, results){
			$scope.error = results.message;
		}
	}

	estadoInicial();

	$scope.guardar = function(){
		$scope.error = '';
		$scope.info = 'Guardando...';
		var vanOk = 0;

		function validar(){
			var is = [];
			for (var i = 0; i < $scope.rows.length; i++) {
				var r = $scope.rows[i];
				r.descripcion = r.descripcion.trim().toUpperCase();
				if (!(r.id >0) && r.descripcion == ''){
					is.push($scope.rows[i]);
				}
			}

			for (var i = 0; i < is.length; i++ ) {
				$scope.rows.splice($scope.rows.indexOf(is[i]), 1)
			}
		}
		validar();
			for (var i = 0; i < $scope.rows.length; i++) {
				var l = $scope.rows[i];
				if (l.id > 0){
					if (l.descripcion == ''){
						vanOk++;
						continue;
					}else{
						localDb.linea.update(l, function(){
							vanOk ++
							if (vanOk == $scope.rows.length){
								done();
							}
						}, 
						function(tx, results){
							vanOk ++
							if (vanOk == $scope.rows.length){
								$scope.error = results.message;
								$scope.$apply();
							}
						});
					}
				}else{
					localDb.linea.insert(l, function(tx, results, id){
						vanOk ++
						if (vanOk == $scope.rows.length){
							done()
						}
					}, 
					function(tx, results){
						$scope.erorr = '';
						$scope.info = '';
						$scope.error = results.message;
						$scope.$apply();
					});
				}

			}
		function done(){
			$scope.erorr = '';
			$scope.info = '';
			$scope.info = 'Guardado con exito';
			//alert('Guardado con exito');
			estadoInicial();
			$scope.callback($scope.rows);
		}

	}

	$scope.eliminar = function(linea){
		$scope.error = '';
		$scope.info = '';
		if (linea.enUso){
			alert('No se puede eliminar porque este registro es usado por Articulos')
		}else{
			if (linea.id == 0){
				$scope.rows.splice( $scope.rows.indexOf(linea), 1);
			}else{
				localDb.linea.delete(linea, ok, no);
				function ok(tx, results){
					console.log('Linea: ' + linea.id + ' Borrada con exito');
					$scope.info = 'Linea ' + linea.descripcion + ' eliminada con exito';
					$scope.rows.splice( $scope.rows.indexOf(linea), 1);
					$scope.$apply();
				}
				function no(tx, results){
					$scope.info = '';
					$scope.error = results.message;;
					$scope.$apply();
				}
			}
		}
	}

	$scope.agregar = function(){
		$scope.error = '';
		$scope.info = '';
		$scope.rows.push({
			id : 0,
			descripcion : '',
			enUso : false
		})
	}
}]).directive('mantenimientoLinea', function(){
	// Runs during compile
	return {
		// name: '',
		// priority: 1,
		// terminal: true,
		scope: { callback : '='}, // {} = isolate, true = child, false/undefined = no change
		controller: 'mantenimientoLineaCtrl',
		// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
		restrict: 'A',
		 template: '<div class="modal fade" id="frmMantLinea" ><div class="modal-dialog ">	\
            <div class="modal-content  card-tab ">	\
              <div class="modal-header">	\
              <h3>Lineas</h3>	\
              </div>	\
              <div class="modal-body">	\
                <div class="row">	\
                  <form>	\
                  <table class="table table-hover ">	\
                    <thead>	\
                      <tr>	\
                        <th>Borrar</th>	\
                        <th>id</th>	\
                        <th>descripcion</th>	\
                        <th class="text-center">En Uso</th>	\
                      </tr>	\
                    </thead>	\
                    <tbody>	\
                      <tr ng-repeat="row in rows">	\
                        <td><button class="btn btn-danger btn-xs" ng-click="eliminar(row)"><span class="fa fa-close"></span></button></td>	\
                        <td>{{((row.id > 0) ? row.id : \'\')}}</td>	\
                        <td class="no-padding"><input type="text" class="form-control" ng-model="row.descripcion"></td>	\
                        <td> <p class="text-center">{{((row.enUso)? \'SI\' : \'NO\')}}</p></td>	\
                      </tr>	\
                    </tbody>	\
                  </table>	\
                  </form>	\
                </div>	\
                <div class="row">	\
                  <div class="col-sm-9">	\
                    <p class="text-danger">{{error}}</p>	\
                    <p class="text-info">{{info}}</p>	\
                  </div>	\
                  <div class="col-sm-3">	\
                    <button class="btn btn-primary" ng-click="agregar()">Agregar</button>	\
                  </div>	\
                </div>	\
              </div>	\
              <div class="modal-footer">	\
                <button type="button" class="btn btn-default" data-dismiss="modal">Salir</button>	\
                <button type="button" class="btn btn-success" data-ng-click="guardar()">Listo</button>	\
              </div>	\
            </div>	\
          </div></div>'
		// templateUrl: '',
		// replace: true,
		// transclude: true,
		// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),

	};
});