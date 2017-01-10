angular.module('frmImprimir',[])
.controller('imprimirPago', ['$scope', function($scope){
	var yo = this;
	this.idPedido = 1;
	this.impresorasDisponibles = [];
	this.error = '';
	this.impresora = 'BlueTooth Printer';
	this.conectado = false;

	var Printer = undefined;	// GENERICO DE IMPRESORA
	if (typeof BTPrinter !== 'undefined') {
	    // the variable is defined
	    Printer = BTPrinter;
	}

	this.comprobante = function(){
		//localDb.pedido.getPedidoDetalle(yo.idPedido, exito, error);

		function exito(cabecera, results){
			var txt = [
			'',
			'',
			'',
			'',
"RUNFOOD" ,
		'RUR # 0932050222001',
		'FACTURA # 001-001-2212   ',
'C.C: 91234102938475619746582',
'Autorizacion: 8781234102934756'	,						 
'Cliente: DIEGO PAGUAY',
	'RUC: 0932050222001',
	'',
	'',
	'PVP        DESCRIPCION    TOTAL',
	'1    Coca Cola 1lt         20.00',
	'                 Base 14%: 20.00',
	'                  Base 0%: 20.00',
	'                    Total: 20.00',
	'',
	'',
	'Descargue su factura electronica en:',
	'www.pcgerente.com/RunFood/',
	'Gracias por preferirnos',
	'',
	'',
	'',
	'',
	''
			].join('\n');

	    Printer.printText(function(data){
		    	console.log(data);
		    },function(err){
		    	yo.error = err;
		    }, txt);
		};

		function error(tx, results){
			yo.error = results.message;
		}

		exito();

	};

var estaConectado = false;

	this.pedido = function(){
		yo.error = '';
			var txt = [
'',
'',
'',
'',
"RUNFOOD" ,
'        Orden #25         ',
'Nombre: DIEGO PAGUAY Quichimbo',
'',
'',
'PVP  DESCRIPCION',
'1    Coca Cola 1lt',
'1    Sopa de Pollo',
'',
'',
'',
'',
'',
''].join('\n');

	    Printer.printText(function(data){
		    	console.log(data);
		    },function(err){
		    	yo.error = err;
		    }, txt);
	}


	this.inicializar = function(){
		yo.error = '';
        yo.impresorasDisponibles = [];
        yo.buscarListado();
	}

	this.buscarListado = function(){
		if (Printer != undefined){
			yo.impresorasDisponibles = [];
	        Printer.list(function(data){
	            console.log("Success");
	            for (var i = 0; i < data.length; i++) {
	            	yo.impresorasDisponibles.push(data[i]);
	            };
	            if (yo.impresorasDisponibles.length == 1 ){
	            	yo.conectarImpresora(true);
	            }
	            $scope.$apply();
	        },function(err){
	            console.log("Error");
	            console.log(err);
	            yo.error = err;
	        });
        }
	}

	this.conectarImpresora = function(intenta2veces){
		yo.error = '';
		if (yo.impresora != undefined || Printer != undefined1){
			    Printer.connect(function(data){
			    	yo.conectado = true;
			    	yo.error = data;
		        },function(err){
		            yo.conectado = false;
		            yo.error = err;
		            if (intenta2veces == true){
		            	yo.conectarImpresora();
		            }
		        }, yo.impresora);
		}
	}

	this.inicializar();



	function UrlExists(url)
	{
	    var http = new XMLHttpRequest();
	    http.open('HEAD', url, false);
	    http.send();
	    return http.status!=404;
	}

}]).directive('frmImprimir',  function(){
	// Runs during compile
	return {
		// name: '',
		// priority: 1,
		// terminal: true,
		// scope: {}, // {} = isolate, true = child, false/undefined = no change
		controller:'imprimirPago',
		controllerAs: 'imprimir',
		restrict: 'A',
		template : `

  <div class="modal fade" id="frmImprimir">
    <div class="modal-dialog modal-sm">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
          <h4 class="modal-title">Impresion</h4>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="input-group">
              <span class="input-group-addon btn-default" data-ng-click="imprimir.buscarListado()"><i class="fa fa-search text-primary"></i></span>
              <select data-ng-model="imprimir.impresora" class="form-control">
                <option data-ng-repeat="printer in imprimir.impresorasDisponibles" value="{{printer}}">{{printer}}</option>
              </select>
              <span class="input-group-addon  btn-default" data-ng-click="imprimir.conectarImpresora()">
                <i  data-ng-class="{'text-danger': imprimir.conectado == false, 'text-success': imprimir.conectado == true}"  class="fa fa-bullseye"></i>
              </span>
            </div>
          </div>
          <div class="row">
            <button data-ng-click="imprimir.comprobante()" class="btn btn-primary">Imprimir Comprobante</button>
          </div>
          <div class="row">
            <button data-ng-click="imprimir.pedido()" class="btn btn-default">Imprimir Pedido</button>
          </div>
        </div>
        <div class="modal-footer">
        <span class="text-danger">{{imprimir.error}}</span>
          <button type="button" class="btn btn-default" data-dismiss="modal">Salir</button>
        </div>
      </div>
    </div>
  </div>`
		// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
		// restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
		// templateUrl: '',
		// replace: true,
		// transclude: true,
		// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
	};
});