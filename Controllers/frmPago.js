angular.module('FormularioPago',['funciones'])
.controller('PagoCtrl', ['$scope', 'IFormularioPago', function($scope, IFormularioPago){
	var frm = this;
	this.totalDiferentesPagos = 0;
	this.numeroPagos = 5;
	this.formaSeleccionada = 1;
	this.iPago = 0;
	this.totalPagar = 0
	this.articulos = [];
	this.arrPagos = [];
	this.results = [];
	this.unico = new PagoClass();
	this.puedeHacerFacturas = false;
	this.documentoPredeterminado = 0;

	function PagoClass(){
		this.cedula= '',
		this.razonSocial= '',
		this.telefono= '',
		this.email= '',
		this.direccion = '',
		this.monto = parseFloat(frm.totalPagar),
		this.formaPago= 'EFECTIVO',
		this.error= '',
		this.validarCedula = true,
		this.efectivo= '',
		this.tarjeta= '',
		this.transf = '',
		this.deposito= '',
		this.cheque= '',
		this.dineroE= '',
		this.unPago= true,
		this.documento = frm.documentoPredeterminado
	}

	this.sumDifPagos = function(){
		var u = frm.unico;
		frm.totalDiferentesPagos =  (parseNullableFloat(u.efectivo) +  parseNullableFloat(u.tarjeta) + parseNullableFloat(u.transf) + parseNullableFloat(u.deposito) + parseNullableFloat(u.cheque) + parseNullableFloat(u.dineroE));
    return frm.totalDiferentesPagos;
	}

	this.cargarArticulos =  function(arr){
		frm.articulos = [];
		for (var i = 0; i < arr.length; i++) {
			frm.articulos.push({
				descripcion: arr[i].descripcion,
				pvpSeleccionado: arr[i].pvpSeleccionado,
        pvp1 : arr[i].pvp1,
        pvp2 : arr[i].pvp2,
        pvp3 : arr[i].pvp3,
        pvp4 : arr[i].pvp4,
				pagaIva: arr[i].pagaIva,
				cantidad : arr[i].cantidad,
        pvp : arr[i].pvp,
        subtotal : arr[i].subtotal,
        iva : arr[i].iva,
        subtotalIva : arr[i].subtotalIva
			})
		}
	}

	this.cargarNumeroPagos = function(){ 
		frm.arrPagos = [];
		for (var i = 0; i < frm.numeroPagos; i++) {
			var p = new PagoClass();
			p.articulosPagar = [];
			p.monto = 0;
			frm.arrPagos.push(p);
			/*frm.arrPagos.push({
				cedula: '',
				razonSocial : '',
				monto : '',
				formaPago : 'EFECTIVO',
				articulosPagar : [],
				validarCedula : true,
				error: '',
				unPago: true,

			})*/
		}
	}


	this.agregarArticulo = function(articulo){
		if (articulo.cantidad > 0){
			var pago = frm.arrPagos[frm.iPago];
			var indexArticulo = frm.articulos.indexOf(articulo);
			if (pago.articulosPagar.length > 0 ){
				var siExistia = false;
				for (var i = 0; i < pago.articulosPagar.length; i++) {
					if (pago.articulosPagar[i].i == indexArticulo){
						articulo.cantidad--
						pago.articulosPagar[i].cantidad++
						siExistia =true;
						break;
					}
				}
				if (siExistia == false ){
					agregar();
				}
			}else{
				agregar();
			}
			calculoMontoPagoMultiple(pago);
		}else{
			articulo.cantidad = 0;
		}
		function agregar(){
			pago.articulosPagar.push({
        id : articulo.id,
				i : indexArticulo,
				descripcion : articulo.descripcion,
				cantidad : 1,
        pvp : articulo.pvp(),
        iva : articulo.iva()
			});
			articulo.cantidad--
		}
	}

	this.quitarArticulo = function(articulo, pMultiple){
		if (articulo.cantidad > 0){
			frm.articulos[articulo.i].cantidad += articulo.cantidad;
		}
		pMultiple.articulosPagar.splice(pMultiple.articulosPagar.indexOf(articulo), 1);
		calculoMontoPagoMultiple(pMultiple)
	}

	this.restarArticulo = function(articulo, pMultiple){
		frm.articulos[articulo.i].cantidad ++;
		articulo.cantidad--;
		if (articulo.cantidad <= 0){
			frm.quitarArticulo(articulo, pMultiple);
		}else{
			calculoMontoPagoMultiple(pMultiple)
		}
	}

	function calculoMontoPagoMultiple(pagoMultiple){
		pagoMultiple.monto = 0;
		if( pagoMultiple.articulosPagar.length > 0 ){
			for (var i = 0; i < pagoMultiple.articulosPagar.length; i++) {
				var art = pagoMultiple.articulosPagar[i]
        pagoMultiple.monto += art.cantidad * (art.pvp + art.iva)
			}
      pagoMultiple.monto = round(pagoMultiple.monto);
		}
	}

	this.validarCedula = function(p){
		p.cedula = p.cedula.trim();
		p.error = '';
		if (p.validarCedula == true){
			validadorCedulaRuc(p.cedula, true,
				function(){
					p.error = '';
				},function(texto){
					p.error = texto;
			})
		}
	}

	IFormularioPago.inicializar = function(articulos, total, config, done, abort){
		frm.puedeHacerFacturas = config.puedeHacerFacturas();
		frm.documentoPredeterminado = config.documentoPredeterminado();

		frm.totalPagar = parseFloat(total);

		frm.unico = new PagoClass();

		frm.cargarArticulos(articulos);
		frm.cargarNumeroPagos();

		frm.done = done;
		frm.abort = abort;
		frm.sumDifPagos();
	}

	this.aceptar = function(){
		var arr = [];
		try{
			if (this.formaSeleccionada  == 1){
				validarPagoIndividual(this.unico);
			}else{
				var total = 0
				for (var i = 0; i < this.arrPagos.length; i++) {
					if (this.arrPagos[i].monto > 0){
						validarPagoIndividual(this.arrPagos[i], i);
						total += this.arrPagos[i].monto
					}
				};
				if (total != frm.totalPagar){
					throw({ message: 'Error al cargar los pagos multiples: Los valores no cuadran con el total de la factura.'});
				}
			}
			//AQUI VA A DAR SI NO TIENE ERRORES!
			if (arr.length > 0){
				for (var i = 0; i < arr.length; i++) {
					delete arr[i]["articulos"];
					delete arr[i]["error"];
					delete arr[i]["validarCedula"];
				}
				if (frm.done != undefined){
					frm.done(arr);
				}else{
					alert('No se puso un DONE');
					console.log(arr);
				}
			}else{
				throw({message: 'El pago debe tener un monto mayor a $0'})
			}
		}catch(e){
			alert(e.message);
		}

		function validarPagoIndividual(p, indexPago){
				p.razonSocial = p.razonSocial.trim();
				var ini = '';
				if (indexPago != undefined){
					ini = 'Error en el pago #' + (indexPago + 1 ) + ': ';
				}
				if (p.error != ''){
					throw({message: ini + 'Los datos del pago contienen errores. Corrijalos antes de continuar.'})
				}else if(p.razonSocial == '' && p.cedula.length > 0){
					throw({message: ini + 'La cedula/ruc del cliente tiene datos, pero razon social está en blanco'})
				}else if (p.razonSocial != '' && p.cedula.length == 0){
					throw({message: ini + 'La razon social del cliente tiene datos, pero la cedula/ruc está en blanco.'})
				}else{
					if (indexPago == undefined && p.unPago == false){
					p.monto =	frm.sumDifPagos();
						if (frm.totalDiferentesPagos != frm.totalPagar){
							throw({message: 'El total es diferente a la suma de los pagos. Revise los pagos.'});
						}
					}
					arr.push(p);
				}
		}
	}

}]).directive('frmPago', function(){
	// Runs during compile
	return {
		// name: '',
		// priority: 1,
		// terminal: true,
		// scope: {}, // {} = isolate, true = child, false/undefined = no change
		// controller: function($scope, $element, $attrs, $transclude) {},
		// require: 'ngModel', // Array = multiple requires, ? = optional, ^ = check parent elements
		// restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
		// template: '',
		// templateUrl: '',
		// replace: true,
		// transclude: true,
		// compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
		/*link: function($scope, iElm, iAttrs, controller) {
				
		}*/
		controller: 'PagoCtrl',
		controllerAs: 'pago',
		restrict: 'A',
		template: `
 <!-- data-ng-controller="PagoCtrl as pago" -->
        <div class="modal" id="frmPago" >
          <div class="modal-dialog modal-lg">
            <div class="modal-content  card-tab ">
              <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
                          <ul class="nav nav-tabs">
                            <li role="tab1" class="active">
                              <a href="#tipoFormaPago1" data-ng-click="pago.formaSeleccionada = 1" aria-controls="tipoFormaPago1" role="tab" data-toggle="tab"><i class="fa fa-user"></i> Una Cuenta</a>
                            </li>
                            <li role="tab2">
                              <a href="#tipoFormaPago2" data-ng-click="pago.formaSeleccionada = 2" aria-controls="tipoFormaPago2" role="tab" data-toggle="tab"><i class="fa fa-group"></i> Cuenta Dividida</a>
                            </li>
                          </ul>

                          <div class="card-body tab-content no-padding">
                            <div role="tabpanel" class="tab-pane active" id="tipoFormaPago1">
	                          <div class="row">
							    <div class="col-sm-12">
							        <ul class="pagination">
							          <li data-ng-class="{active: pago.unico.documento == 2}" >
							            <a data-ng-class="{collapse : !pago.puedeHacerFacturas}" ng-click="pago.unico.documento = ((pago.puedeHacerFacturas) ? 2 : pago.unico.documento)">FACTURA</a>
							          </li>
							          <li data-ng-class="{active: pago.unico.documento == 1}" >
							            <a ng-click="pago.unico.documento = 1">NOTA DE ENTREGA</a>
							          </li>
							        </ul>
							    </div>
							  </div>
                              <div class="row">
                                <div class="col-sm-4">
                                <input type="text" name="cedula" placeholder="9999999999999" id="inputCedula" class="form-control" ng-model="pago.unico.cedula" data-ng-change="pago.validarCedula(pago.unico)" title="Cedula">
                                </div>
                                <div class="col-sm-8">
                                  <input type="text" name="razonSocial" id="inputRazonSocial" class="form-control" ng-model="pago.unico.razonSocial" placeholder="Consumidor Final" itle="Razon Social">
                                </div>
                              </div>
                              <p ng-class="{'text-danger': pago.unico.error.length > 0, 'text-success':pago.unico.error == ''}">
                                <i class="fa" ng-class="{'fa-close': pago.unico.error.length > 0, 'fa-check':pago.unico.error == ''}"></i>
                                 {{pago.unico.error  || "Identificación valida"}}
                              </p>
                              <div class="row no-padding">
                                  <div class="checkbox">
                                      <input type="checkbox" id="pagoUnicoValidar" data-ng-model="pago.unico.validarCedula" ng-change="pago.validarCedula(pago.unico)">
                                      <label for="pagoUnicoValidar">
                                        Validar Cedula
                                      </label>
                                  </div>
                              </div>
                              <div class="row no-padding">
                                <a class="btn no-padding" data-toggle="collapse" data-target="#datosExtras">Mas datos &raquo;</a>
                              </div>
                              <div class="row collapse collapse-group"  id="datosExtras">
                                <div class="col-sm-12">
                                  <div class="row">
                                    <div class="col-sm-4">
                                      <input type="text" class="form-control" placeholder="Telefono" ng-model="pago.unico.telefono">
                                    </div>
                                    <div class="col-sm-8">
                                      <input type="text" class="form-control" placeholder="correo@correo.com" ng-model="pago.unico.email">
                                    </div>
                                  </div>
                                  <div class="row">
                                    <div class="col-sm-12">
                                      <input type="text" class="form-control" placeholder="Direccion..." ng-model="pago.unico.direccion">
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div class="row">
                                <div class="col-sm-5">
                                  <ul class="nav nav-pills">
                                    <li role="tabUnPago" class="active"><a href="#containerUnPago" aria-controls="containerUnPago" role="pill" data-toggle="pill" data-ng-click="pago.unico.unPago = true">Un Pago</a></li>
                                    <li role="tabDiferentesPagos" ><a href="#containerDiferentesPagos" aria-controls="containerDiferentesPagos" role="pill" data-toggle="pill" data-ng-click="pago.unico.unPago = false">Diferentes Pagos</a></li>
                                  </ul>
                                </div>
                              </div>
                              <div class="row">
                                <div class="col-sm-7">
                                  <div class="tab-content">
                                    <div role="tabpanel" class="tab-pane fade in active" id="containerUnPago">
                                      <ul class="pagination">
                                        <li  ng-class="{active: pago.unico.formaPago == 'EFECTIVO'}">
                                          <a ng-click="pago.unico.formaPago = 'EFECTIVO'"><i class="fa fa-money"></i></a>
                                        </li>
                                        <li ng-class="{active: pago.unico.formaPago == 'TARJETA CREDITO'}">
                                          <a ng-click="pago.unico.formaPago = 'TARJETA CREDITO'"><i class="fa fa-credit-card"></i></a>
                                        </li>
                                        <li ng-class="{active: pago.unico.formaPago == 'DINERO ELECTRONICO'}">
                                          <a ng-click="pago.unico.formaPago = 'DINERO ELECTRONICO'"><i class="fa fa-database"></i></a>
                                        </li>
                                        <li ng-class="{active: pago.unico.formaPago == 'TRANSFERENCIA'}">
                                          <a ng-click="pago.unico.formaPago = 'TRANSFERENCIA'"><i class="fa fa-reply-all"></i></a>
                                        </li>
                                        <li ng-class="{active: pago.unico.formaPago == 'DEPOSITO'}">
                                          <a ng-click="pago.unico.formaPago = 'DEPOSITO'"><i class="fa fa-level-down"></i></a>
                                        </li>
                                        <li ng-class="{active: pago.unico.formaPago == 'CHEQUE'}">
                                          <a ng-click="pago.unico.formaPago = 'CHEQUE'"><i class="fa fa-cc"></i></a>
                                        </li>
                                      </ul>
                                      <p class="help-block">{{pago.unico.formaPago}}</p>
                                    </div>
                                    <div role="tabpanel" class="tab-pane fade"  id="containerDiferentesPagos">
                                      <form class="form-inline">
                                        <div class="form-group  col-sm-4">
                                          <div class="input-group">
                                          <span class="input-group-addon">
                                            <i class="fa fa-money"></i>
                                          </span>
                                            <input type="text" data-ng-change="pago.sumDifPagos()" data-ng-model="pago.unico.efectivo" class="form-control">
                                          </div>
                                        </div>
                                        <div class="form-group  col-sm-4">
                                          <div class="input-group">
                                          <span class="input-group-addon">
                                            <i class="fa fa-credit-card"></i>
                                          </span>
                                            <input type="text" data-ng-change="pago.sumDifPagos()" data-ng-model="pago.unico.tarjeta"  class="form-control">
                                          </div>
                                        </div>
                                        <div class="form-group  col-sm-4">
                                          <div class="input-group">
                                          <span class="input-group-addon">
                                            <i class="fa fa-database"></i>
                                          </span>
                                            <input type="text" data-ng-change="pago.sumDifPagos()" data-ng-model="pago.unico.dineroE"  class="form-control">
                                          </div>
                                        </div>
                                        <div class="form-group  col-sm-4">
                                          <div class="input-group">
                                          <span class="input-group-addon">
                                            <i class="fa fa-reply-all"></i>
                                          </span>
                                            <input type="text" data-ng-change="pago.sumDifPagos()"  data-ng-model="pago.unico.transf" class="form-control">
                                          </div>
                                        </div>
                                        <div class="form-group  col-sm-4">
                                          <div class="input-group">
                                          <span class="input-group-addon">
                                            <i class="fa fa-level-down"></i>
                                          </span>
                                            <input type="text" data-ng-change="pago.sumDifPagos()"  data-ng-model="pago.unico.deposito" class="form-control">
                                          </div>
                                        </div>
                                        <div class="form-group  col-sm-4">
                                          <div class="input-group">
                                          <span class="input-group-addon">
                                            <i class="fa fa-cc"></i>
                                          </span>
                                            <input type="text" data-ng-model="pago.unico.cheque"  class="form-control">
                                          </div>
                                        </div>
                                        <div class="col-sm-4">
                                  			<p  ng-class="{'text-danger': (pago.totalDiferentesPagos != pago.totalPagar), 'text-success': (pago.totalDiferentesPagos == pago.totalPagar)}">Diferencia: {{ pago.totalPagar - pago.totalDiferentesPagos | currency}}</p>
										</div>
                                      </form>
                                    </div>
                                  </div>
                                </div>

                                <div class="col-sm-4">
                                  <h4>TOTAL A PAGAR: {{pago.unico.monto | currency}}</h4>
                                </div>
                              </div>
                            </div>
                            <div role="tabpanel" class="tab-pane" id="tipoFormaPago2">
                              <div class="row">
                                <div class="col-sm-9">
                                  <form class="navbar-form navbar-left no-padding" >
                                    <div class="form-group">
                                    <label for="pagination" class="form-label">Numero de Pagos: </label>
                                    </div>
                                    <div class="form-group">
                                      <ul class="pagination">
                                        <li ng-init="p.i = pago.arrPagos.indexOf(p)" data-ng-repeat="p in pago.arrPagos" ng-class="{active : pago.iPago == p.i}" >
                                          <a ng-click="pago.iPago = p.i">
                                            {{pago.arrPagos.indexOf(p) + 1 }}
                                          </a>
                                        </li>
                                      </ul>
                                    </div>
                                  </form>
                                </div>
                                <div class="col-sm-3">
                                    <h3>TOTAL: {{pago.totalPagar | currency}}</h3>
                                </div>    
                                </div>                            
                              <div class="row">
                                <div class="col-sm-8">
                                    <div ng-init="p.i = pago.arrPagos.indexOf(p)" ng-class="{collapse: pago.iPago != p.i}" ng-repeat="p in pago.arrPagos">
                                     <!-- <h3>PAGO {{p.i + 1}}</h3> -->
			                            <div class="row">
									      <div class="col-sm-12">
									          <ul class="pagination">
									            <li data-ng-class="{active: p.documento == 2}" >
									              <a data-ng-class="{collapse : !pago.puedeHacerFacturas}" ng-click="p.documento = ((pago.puedeHacerFacturas) ? 2 : p.documento)">FACTURA</a>
									            </li>
									            <li data-ng-class="{active: p.documento == 1}" >
									              <a ng-click="p.documento = 1">NOTA DE ENTREGA</a>
									            </li>
									          </ul>
									      </div>
									    </div>
                                        <div class="row">
                                          <div class="col-sm-4">
                                          <input type="text" name="cedula" placeholder="9999999999999" id="inputCedula" class="form-control" data-ng-model="p.cedula" title="Cedula" data-ng-change="pago.validarCedula(p)">
                                          </div>
                                          <div class="col-sm-8">
                                            <input type="text" name="razonSocial" id="inputRazonSocial" class="form-control" ng-model="p.razonSocial" placeholder="Consumidor Final" title="Razon Social">
                                          </div>
                                        </div>
                                        <p ng-class="{'text-danger': p.error.length > 0, 'text-success':p.error == ''}">
                                          <i class="fa" ng-class="{'fa-close': p.error.length > 0, 'fa-check':p.error == ''}"></i>
                                           {{p.error  || "Identificación valida"}}
                                        </p>
                                        <div class="row no-padding">
                                            <div class="checkbox">
                                                <input type="checkbox" id="paraPago{{p.i}}" data-ng-model="p.validarCedula" ng-change="pago.validarCedula(p)">
                                                <label for="paraPago{{p.i}}">
                                                  Validar Cedula
                                                </label>
                                            </div>
                                        </div>
                                        <div class="row no-padding">
                                          <a class="btn no-padding" data-toggle="collapse" data-target="#datosExtras{{p.i}}">Mas datos &raquo;</a>
                                        </div>
                                        <div class="row collapse collapse-group"  id="datosExtras{{p.i}}">
                                          <div class="col-sm-12">
                                            <div class="row">
                                              <div class="col-sm-4">
                                                <input type="text" class="form-control" placeholder="Telefono" ng-model="p.telefono">
                                              </div>
                                              <div class="col-sm-8">
                                                <input type="text" class="form-control" placeholder="correo@correo.com" ng-model="p.email">
                                              </div>
                                            </div>
                                            <div class="row">
                                              <div class="col-sm-12">
                                                <input type="text" class="form-control" placeholder="Direccion..." ng-model="p.direccion">
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div class="row">
                                          <div class="col-sm-6">
                                            <ul class="pagination">
                                              <li  ng-class="{active: p.formaPago == 'EFECTIVO'}">
                                                <a ng-click="p.formaPago = 'EFECTIVO'"><i class="fa fa-money"></i></a>
                                              </li>
                                              <li ng-class="{active: p.formaPago == 'TARJETA CREDITO'}">
                                                <a ng-click="p.formaPago = 'TARJETA CREDITO'"><i class="fa fa-credit-card"></i></a>
                                              </li>
                                              <li ng-class="{active: p.formaPago == 'DINERO ELECTRONICO'}">
                                                <a ng-click="p.formaPago = 'DINERO ELECTRONICO'"><i class="fa fa-database"></i></a>
                                              </li>
                                              <li ng-class="{active: p.formaPago == 'TRANSFERENCIA'}">
                                                <a ng-click="p.formaPago = 'TRANSFERENCIA'"><i class="fa fa-reply-all"></i></a>
                                              </li>
                                              <li ng-class="{active: p.formaPago == 'DEPOSITO'}">
                                                <a ng-click="p.formaPago = 'DEPOSITO'"><i class="fa fa-level-down"></i></a>
                                              </li>
                                              <li ng-class="{active: p.formaPago == 'CHEQUE'}">
                                                <a ng-click="p.formaPago = 'CHEQUE'"><i class="fa fa-cc"></i></a>
                                              </li>
                                            </ul>
                                            <p class="help-block">{{p.formaPago}}</p>
                                          </div>
                                          <div class="col-sm-4">
                                            <input type="text" placeholder="$ 0.00" class="form-control" ng-model="p.monto">
                                          </div>
                                        </div>
                                        <div class="row">
                                          <li class="list-group-item" data-ng-repeat="pA in p.articulosPagar">
                                            <button  type="button" class="btn btn-danger btn-xs" data-ng-click="pago.quitarArticulo(pA, p)">x</button>
                                            <strong>{{pA.cantidad}}</strong>
                                               {{pA.descripcion}}
                                            <button type="button" class="btn btn-warning btn-xs pull-right" data-ng-click="pago.restarArticulo(pA, p)">-</button>
                                          </li>
                                        </div>
                                      </div>
                                </div>
                                <div class="col-sm-4">
                                  <div class="list-group">
                                    <a data-ng-class="{disabled : item.cantidad == 0}" data-ng-click="pago.agregarArticulo(item)" href="#" class="list-group-item btn" data-ng-repeat="item in pago.articulos">
                                      <span class="badge">{{item.pvp() + item.iva() | currency}}</span>
                                      <p class="list-group-item-header"><strong>{{item.cantidad }} = {{item.subtotal() + item.subtotalIva() | currency}}</strong></p>
                                      <p class="list-group-item-text">{{item.descripcion}}</p>
                                    </a>
                                  </div>
                                </div>
                              </div>
                            </div>
                            </div>
                            </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Salir</button>
                <button type="button" class="btn btn-primary" data-ng-click="pago.aceptar()">Listo</button>
              </div>
            </div>
          </div>
        </div>
	`
	};
}).service('IFormularioPago', function(){
	var api = this;
});
