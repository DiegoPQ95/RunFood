angular.module('FormularioReportes',['funciones', 'smart-table'])
.controller('cierreCajaCtrl', ['$scope','localDb',  function($scope, localDb){
	var rpt = this;
	this.hoy = new Date();
	rpt.data = [];
	this.efectivo = 0;
	this.transf = 0;
	this.tarjeta = 0;
	this.cheque = 0;
	this.deposito = 0;
	this.dineroE = 0;
	rpt.tempData = [];
	this.error = '';
	localDb.init();

	

	this.cargar = function(){
		var query = `SELECT p.id, (p.tipo || 1) * p.monto monto, c.numero, c.serie1, c.serie2,
		IFNULL(d.descripcion, 'PAGO') documento, c.idDocumento, p.formaPago idFormaPago,
		p.fechaCreacion, cli.razonSocial 
		FROM PAGO p INNER JOIN
		CLIENTE cli on cli.id = p.idCliente LEFT JOIN
		COMPROBANTE c on c.id = p.idComprobante LEFT JOIN
		DOCUMENTO d on d.id = c.idDocumento WHERE date(p.fechaCreacion) = date(?)`,
		params = [rpt.hoy.getFullYear() + '-' + pad(rpt.hoy.getMonth() +1 ,2) + '-' +pad(rpt.hoy.getDay() +1 , 2)];
		localDb.query(query, params, exito, err);
		function exito(tx, results){
			rpt.efectivo = 0;
			rpt.transf = 0;
			rpt.tarjeta = 0;
			rpt.cheque = 0;
			rpt.deposito = 0;
			rpt.dineroE = 0;
			rpt.data.splice(0,rpt.data.length);
			rpt.tempData.splice(0,rpt.tempData.length);
			for (var i = 0; i < results.rows.length; i++) {
				var row  = results.rows[i];
				calculoTotales(row);
				row.formaPago = localDb.formaPago.getString(row.idFormaPago);
				if (row.documento == 'FACTURA'){
					row.numero = row.serie1 + '-' + row.serie2 + '-' + row.numero
				}
				row.fechaCreacion = new Date(row.fechaCreacion);
				rpt.data.push(row);
				rpt.tempData.push(row)
			}
			$scope.$apply();
		}
		function err(tx,results){
			alert('Error al cargar el reporte: ' + results.message);
		}
	}

	function calculoTotales(row){
		if (row.idFormaPago == 1 ){
			rpt.efectivo += row.monto
		}else if (row.idFormaPago ==2 ){
			rpt.tarjeta += row.monto
		}else if (row.idFormaPago == 3){
			rpt.transf  += row.monto
		}else if (row.idFormaPago == 4){
			rpt.deposito  += row.monto
		}else if (row.idFormaPago == 5){
			rpt.cheque  += row.monto
		}else if (row.idFormaPago == 6){
			rpt.dineroE  += row.monto
		}
	}

	this.cargar();

}]);