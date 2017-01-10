angular.module('funciones', [])
.service('localDb', ['$http', function($http){
	RunFood = this;
	this.db = null;
	this.configuracion = {
		puedeHacerFacturas : function(){
			return false
		},
		documentoPredeterminado : function(){
			return 1
		},
		serie1 : function(){
			return '001'
		},
		serie2 : function(){
			return '001'
		}
	};


	this.articulo = {
		get: function(callback, error, id){
			var q = "SELECT * FROM ARTICULO where esComponente= 1 ";
			var params = [];
			if (id != undefined){
				q += ' and id =?';
				params.push(id);
			}
			RunFood.query(q,params,function(tx, results){
						var arr = [];
						for (var i = 0; i < results.rows.length; i++) {
							var articulo = results.rows[i];
							articulo.pagaIva = castBool(articulo.pagaIva);
							arr.push(articulo);
						}
						callback(arr, results);
					},error);
		},
		getExistencias : function(callback, error, id){
			var arr = [];	//OBJETO DE RETORNO POR DEFAULT
			var q = "select a.id, a.codigo, a.esComponente,a.descripcion, a.pagaIva, a.idLinea,  a.pvp1, 0 cantidad, sum(d.detalleConSigno) existencia,	\
			d.numero, d.documento, d.fechaCreacion from detalleArticulos d INNER JOIN	\
			ARTICULO a on a.id = d.idArticulo INNER JOIN	\
			LINEA l on l.id = a.idLinea 	\
			where a.esComponente = 1	\
			GROUP BY a.id"
 			,params = [];
 			RunFood.query(q, params,
 				function(tx, results){
 					console.log('Articulos Existencias ejcutado correctamente.');
 					for (var i = 0; i < results.rows.length; i++) {
 						results.rows[i].pagaIva = castBool(results.rows[i].pagaIva);
 						arr.push(results.rows[i]);
 					};
 					callback(arr, results);
 				}, function(tx, results){
 					console.log('Articulos Existencias ejcutado con errores:');
 					console.log(results);
 					error(tx, results);
 				})
		},
		update : function(art, callback, error){
			RunFood.query('UPDATE ARTICULO set  idLinea =?, codigo = ?, descripcion = ?, pvp1 =?, pvp2=?, pvp3=?, pvp4=?, pagaIva =? where id = ?',
		[art.idLinea, art.codigo, art.descripcion, art.pvp1, art.pvp2, art.pvp3, art.pvp4, art.pagaIva, art.id], callback, error )
		},
		insert : function(art, callback, error){
			RunFood.query('INSERT INTO ARTICULO (fechaCreacion, estado, idLinea, codigo, descripcion, pvp1, pvp2, pvp3, pvp4, esComponente)' +
				"VALUES (datetime('now', 'localtime'),?,?,?,?,?,?,?,?,?)", ['A', art.idLinea, art.codigo, art.descripcion, art.pvp1, art.pvp2, art.pvp3, art.pvp4, 1]
				, callback, error);
		},
		delete: function(art, callback, error){
			RunFood.query('DELETE FROM ARTICULO WHERE id = ?', [art.id], callback, error);
		},
		lineasArticulos : function(callback, error, incluyeProductosFinales){
			var arr = [];
			var lineasCargadas = 0;
			var whereComponente = 'and esComponente = 1 ';
			if (incluyeProductosFinales == true){
				whereComponente = ''
			};
			RunFood.query('SELECT * FROM LINEA order by descripcion asc', [],
				function(tx, dataSetLineas){
					for (var i = 0; i < dataSetLineas.rows.length; i++) {
						var objectLinea = dataSetLineas.rows[i];
						objectLinea.articulos = [];
						arr.push(objectLinea);
						var queryArticulos = "SELECT *, 0 as cantidad, 'pvp1' as pvpSeleccionado FROM ARTICULO where idLinea = ? ";
						tx.executeSql(queryArticulos, [objectLinea.id],
							function(tx, dataSetArticulos){
								if (dataSetArticulos.rows.length > 0 ){
									var indexLinea = indexFromId(arr, dataSetArticulos.rows[0].idLinea);
									for (var iArt = 0; iArt < dataSetArticulos.rows.length; iArt++) {
										var rr = dataSetArticulos.rows[iArt];
										rr.pvp = function(){
											var h = this[this.pvpSeleccionado];
											if (h == null || h == undefined){
												return 0
											}else{
												return h
											}
										}

										rr.iva = function(ivaPorcentaje){
											var iiva = ivaPorcentaje;
											if (iiva == undefined){
												iiva = 14
											}
											if (this.pagaIva){
												return round((this.pvp() * iiva )/100)
											}else{
												return 0
											}
										}

										rr.subtotalIva = function(ivaPorcentaje){
											if (this.pagaIva){
												var iiva = ivaPorcentaje;
												if (iiva == undefined){
													iiva = 14
												};
												return round(this.subtotal() * iiva / 100)
											}else{
												return 0;
											}
										}

										rr.subtotal = function(){
											if (this.cantidad > 0){
												return round(rr.pvp() * this.cantidad)
											}else{
												return 0
											}
										};

										arr[indexLinea].articulos.push(rr);
									};
								console.log('Linea: ' + arr[indexLinea].descripcion + ' con sus articulos cargados.');
								};
								lineasCargadas++
								if (lineasCargadas == dataSetLineas.rows.length){
									callback(arr, dataSetArticulos);
								};
								console.log('Tenemos ' + lineasCargadas + ' lineas cargadas')
							}, function(tx, results){
								console.log('Error al ejecutar: ' + queryArticulos)
								console.log(results);
								lineasCargadas++
								if (lineasCargadas == dataSetLineas.rows.length){
									error(tx, results);
								};
							});
						};
				}, error);
		}
	}

	this.linea = {
		insert: function(linea, callback, error){
			RunFood.query("INSERT INTO LINEA (descripcion, fechaCreacion, estado) values(?, datetime('now', 'localtime'), 'A')", [linea.descripcion], 
				function(tx, results){
					linea.id = results.insertId;
					callback(tx, results, linea.id);
				}, error);
		},
		update : function(linea, callback, error){
			RunFood.query("UPDATE LINEA set descripcion = ? where id = ?", [linea.descripcion, linea.id], callback, error);
		},
		delete : function(linea, callback, error){
			RunFood.query('DELETE FROM LINEA where id = ' + linea.id, [], callback, error );
		},
		get : function(callback, error){
			RunFood.query("SELECT * FROM LINEA order by descripcion asc", [],
			function(tx, result){
				arr = [];
				for (var i = 0; i < result.rows.length; i++){
				arr.push(result.rows[i]);
				}
				callback(arr, result);
			}, error );
		},
		getEstaEnUso : function(callback, error){
			RunFood.query("SELECT  l.*, EXISTS(SELECT idLinea from articulo where idLinea = l.id) enUso FROM linea l ORDER BY id", [],
			function(tx, result){
				arr = [];
				for (var i = 0; i < result.rows.length; i++){
				arr.push(result.rows[i]);
				}
				callback(arr, result);
			}, error );
		}
	}

	this.articuloProducto = {
		get: function(callback, error,tipo, id){
			// PARAMETROS BASICOS
			var arr = [];	// ESTE ES EL OBJECTO QUE RETORNA!
			var q =`
				SELECT DISTINCT a.* FROM ARTICULO_PRODUCTO p INNER JOIN
				ARTICULO a on p.idProducto = a.id WHERE p.tipo = ?
			`,
				params = [];
			var vecesLleva = 0;

			if (tipo != undefined){
				params.push(tipo);
			}else{
				params.push('P');
			}

			if (id != undefined){
				q += ' and p.id = ?';
				params.push(id);
			}

			// BUSCAR LAS CABECERAS
			RunFood.query(q, params,
				function(tx, cabeceras){
					for (var i = 0; i < cabeceras.rows.length; i++) {
						// INICIALIZAR EL CABECERA
						var row = cabeceras.rows[i];
						row.pagaIva = castBool(row.pagaIva);
						row.componentes = [];
						//	cabecera.pagaIva = castBool(cabecera.pagaIva);		//CHECAR SI SE NECESITA, PORQUE SINO, UY! :D
						arr.push(row);
						// INICIALIZAR EL CABECERA
						var q1 = "SELECT a.*, ap.cantidad, ap.idProducto	\
														  FROM ARTICULO p INNER JOIN	\
														  ARTICULO_PRODUCTO ap on p.id = ap.idProducto INNER JOIN	\
														  ARTICULO a on a.id = ap.idArticulo where p.id = ?"
							arr1 = [row.id];
						//BUSCAR LOS DETALLES
						tx.executeSql(q1, arr1,
							function(tx, detalles){
								console.log('CONSULTA: ' + q1  + ' EJECUTADA CON EXITO');
								var iCabecera = indexFromId(arr, detalles.rows[0].idProducto);
								//INICIALIZAR Y AGREGAR EL DETALLE
								for (var iDet = 0; iDet < detalles.rows.length; iDet++) {
									var det = detalles.rows[iDet];
									arr[iCabecera].componentes.push(det);
								};
								vecesLleva ++;
								if (vecesLleva == (cabeceras.rows.length)){
									callback(arr, cabeceras);
								}
							},
							function(tx, res){
								//ERROR AL ENCONTRAR EL DETALLE
								console.log('CONSULTA: ' + q1  + ' EJECUTADA CON ERRORES');
								console.log(res);
								vecesLleva ++;
								if (vecesLleva == (cabeceras.rows.length)){
									error(tx, res);
								}
							});
					}
				},error);
		},
		update : function(art, callback, error){
			RunFood.articulo.update(art,
				function(tx, results){
					RunFood.articuloProducto.deleteDetalle(tx, art, function(tx, results){
						RunFood.articuloProducto.insertDetalle(tx, art, callback, error);
					}, error);
				}
				,error)
		},
		insert : function(artProd, callback, error){
			RunFood.db.transaction(function(transaccion){
				// INSERT DEL CABECERA
				transaccion.executeSql(`
					INSERT INTO ARTICULO
					(fechaCreacion, estado, idLinea, codigo, descripcion, pvp1, pvp2, pvp3, pvp4, esComponente, pagaIva)
					VALUES
					(datetime('now', 'localtime'),?,?,?,?,?,?,?,?,?,?)`,
					['A', artProd.idLinea, artProd.codigo, artProd.descripcion, artProd.pvp1, artProd.pvp2, artProd.pvp3, artProd.pvp4, 0, artProd.pagaIva],
				function (tx, res){
				// INSERT DEL DETALLE
						console.log('CABECERA GUARDADO ID =', res.insertId);
						artProd.id = res.insertId;
						RunFood.articuloProducto.insertDetalle(tx, artProd, callback, error);
				},
				function(tx, res){
				// INSERT DEL CABECERA
					console.log('ERROR CABECERA GUARDADO');
					console.log(res);
					error(undefined, res);
				});
			})
		},
		insertDetalle : function(tx, artProd, callback, error){
			var vecesHecho = 0;
			for (var i = 0; i < artProd.componentes.length; i++) {
				// INICIALIZANDO EL QUERY
				var queryInsert = `INSERT INTO ARTICULO_PRODUCTO (fechaCreacion, estado, idArticulo, cantidad, idProducto, tipo)
				VALUES( datetime('now', 'A', ?,?,?,?) `;
				var arr = [artProd.componentes[i].id, artProd.componentes[i].cantidad, artProd.id, artProd.tipo];
				//ejecutando el query
				tx.executeSql(queryInsert, arr
					,function(tx, results){
						console.log('Guarada la fila ' + (i + 1) );
						if (vecesHecho == (artProd.componentes.length -1)){
						console.log('Guardar FINALIZADO');
							callback(tx, results, artProd.id);
						};
						vecesHecho++;
					}, function(tx, res){
							console.log('Error en la fila ' + (i+1) + res.message)
							if (vecesHecho == (artProd.componentes.length -1)){
								error(tx, results, artProd.id);
							console.log('Guardar FINALIZADO con errores');
							};
						vecesHecho++;
						});
			};
		},
		delete : function(art, callback, error){
			RunFood.db.transaction(function(tx){
				RunFood.articuloProducto.deleteDetalle(tx
					,art
					,function(tx, results){
						var q ='DELETE FROM ARTICULO where id = ?';
						tx.executeSql(q, [art.id],
							function(tx, results){
								console.log('EXITO AL EJECUTAR: ' + q);
								callback(art.id, results);
							},
							function(tx, res){
								console.log('ERROR AL EJECUTAR: ' + q );
								console.log(res);
								error(art.id, results);
							})
					}
					,error)
				});
		},
		deleteDetalle :  function(tx, art, callback, error){
			tx.executeSql('DELETE FROM ARTICULO_PRODUCTO where idProducto = ?', [art.id], function(tx, res){
				console.log('Borrado exitoso de ARTICULO_PRODUCTO where idProducto= ' + art.id)
				callback(tx, res);
			}, function(tx, res){
				console.log('Error al borrar ARTICULO_PRODUCTO where idProducto=' + art.id);
				console.log(res);
				error(art.id, res);
			})
		}
	}

	this.ajuste ={
		insert : function(ajuste, callback, error){
			RunFood.query("INSERT INTO AJUSTE (fechaCreacion, tipo, observacion) VALUES ( datetime('now', 'localtime'),?,?)",[ajuste.tipo, ajuste.observacion],
			function(tx, results){
				var id = results.insertId;
				var q = 'INSERT INTO AJUSTE_DETALLE (idAjuste, idArticulo, cantidad) VALUES (?,?,?)';
				var detallesCount = 0;
				for (var i = 0; i < ajuste.detalle.length; i++) {
					tx.executeSql(q, [id, ajuste.detalle[i].id, ajuste.detalle[i].cantidad],
						function(tx, results1){
							console.log('DETALLE ' + i + ' ejecutado con exito')
							detallesCount++
							if (detallesCount == ajuste.detalle.length){
							console.log('AJUSTE CON DETALLE GUARDADO CON EXITO')
								callback(id, results1);
							}
						},function(tx, results1){
							console.log('DETALLE ' + i + ' ejecutado con errores: ');
							detallesCount++
							if (detallesCount == ajuste.detalle.length){
							console.log('AJUSTE CON DETALLE GUARDADO CON EXITO')
								callback(id, results1);
						}
					});
				}
			},error)
		},
		anular : function(ajuste, callback, error){

		},
		get : function(callback, error){

		}
	}

	this.pedido = {
		insert : function(pedido, callback, error){
			// PRIMERO VOY A INSERTAR EL CABECERA
			var detalleCargado = false;
			var pagosCargados = false;
			RunFood.query("INSERT INTO PEDIDO (fechaCreacion, estado, ordenante, base0, baseIva, iva, total) \
				VALUES(datetime('now', 'localtime'),?,?,?,?,?,?)", [pedido.estado, pedido.ordenante, pedido.base0, pedido.baseIva, pedido.iva, pedido.total],
				function(tx, results){
					pedido.id = results.insertId;
					if (pedido.estado == 'A'){
					}else{
						pagosCargados = true;
					};
					console.log('Pedido insertado ID: ' + pedido.id);
					RunFood.pedido.insertDetalle(tx, pedido, okD, errD);
					function okD(tx, dResults){
						if (pedido.estado == 'A'){
							RunFood.pedido.insertPagos(tx, pedido, okP, errP);
							function okP(tx, pResults){
								exito(tx, pResults);
							}
							function errP(tx, pResults){
								error(tx, pResults);
							}
						}else{
							exito(tx, results);
						}
					}

					function errD(tx, dResults){
						error(tx, dResults);
					}

					function exito(tx, results){
						console.log('Pedido cargado correctamente');
						console.log('Pedido #:' + pedido.id);
						callback(pedido.id, results);
					}
				}, error);
		},
		insertDetalle : function(tx, pedido, callback, error){
			var inserts = 0
			var primerErrorEnviado = false;
			for (var i = 0; i < pedido.detalle.length; i++) {
				var d = pedido.detalle[i];
				if (d.productoFinal == undefined){
					d.productoFInal = null
				};
				if (d.esComponente == undefined){
					d.esComponente = 0;
				};

				tx.executeSql(`
					INSERT INTO PEDIDO_DETALLE (idPedido, idArticulo, cantidad, valor, esComponente, productoFinal)
					VALUES (?,?,?,?,?,?)`, [pedido.id, d.id, d.cantidad, d.valorSeleccionado, d.esComponente, d.productoFinal], ok, err)
			};

			function ok(tx, results){
				inserts ++
				console.log('INSERT PEDIDO_DETALLE con exito fila: ' + inserts);

				if (inserts == pedido.detalle.length){
					callback(tx, results);
				}
			};

			function err(tx, results){
				inserts++
				console.log('INSERT PEDIDO_DETALLE con exito en fila ' + inserts);
				console.log(results);
				if (primerErrorEnviado == false){
					primerErrorEnviado = true;
					error(tx, results);

				}
			}
		},
		insertPagos : function(tx, pedido, callback, error){
			var inserts = 0
			var primerErrorEnviado = false;
				if (pedido.pagos.length == 1 ){
					//SIMPLE: UN PAGO, UNA FORMA DE PAGO
					var pago = pedido.pagos[0];
					RunFood.comprobante.insert(tx, pedido, pago, listoPago, error)
				}else{
					for (var i = 0; i < pedido.pagos.length; i++) {
					RunFood.comprobante.insert(tx, pedido, pago, listoPago, error)
					}
				}
					function listoPago(tx, results, id ){	
						pago.idComprobante = id;
						RunFood.pago.insert(pago, ok, err, tx)
					};

			function ok(tx, results){
				inserts ++
				console.log('INSERT PAGO con exito fila: ' + inserts);

				if (inserts == pedido.pagos.length){
					callback(tx, results);
				}
			};

			function err(tx, results){
				inserts++
				console.log('INSERT PAGO con exito en fila ' + inserts);
				console.log(results);
				if (primerErrorEnviado == false){
					primerErrorEnviado = true;
					error(tx, results);
				}
			}
		},
		anular : function(pedido, callback, error){

		},
		get : function(callback, error){

		},
		getNumero : function(callback, error){
			RunFood.query('SELECT IFNULL(IFNULL(max(serverID), MAX(id)), 1) numero FROM PEDIDO ', [],
				function(tx, results){
					callback(results.rows[0].numero, results);
				}, error);
		}
	}

	this.pago = {
		insert : function(p, callback, error, tx){
			// p es el Pago completo: El pago contempla el numero de Cedula, RazonSocial... etc.
			RunFood.cliente.getId(p, clienteObtenido, error, tx);
			function clienteObtenido(tx, results, idCliente){
				p.idCliente = idCliente;
				if (p.tipo == undefined ){p.tipo = '+'};
				if (p.documentoTransaccion == undefined ){p.documentoTransaccion = null};

				if (p.unPago == true || p.unPago == undefined){
					// UN PAGO SIMPLE
					tran(p, "monto");
				}else{
					// UN PAGO QUE SE HA HECHO CON DIFERENTES FORMAS DE PAGO.
					if (p.efectivo > 0){
						tran(p, "efectivo" , RunFood.formaPago.getId("EFECTIVO"))
					}
					if (p.tarjeta > 0){
						tran(p, "tarjeta" , RunFood.formaPago.getId("TARJETA CREDITO"))
					}
					if (p.dineroE > 0){
						tran(p, "dineroE" , RunFood.formaPago.getId("DINERO ELECTRONICO"))
					}
					if (p.deposito > 0){
						tran(p, "deposito", RunFood.formaPago.getId("DEPOSITO"))
					}
					if (p.cheque > 0){
						tran(p, "cheque", RunFood.formaPago.getId("CHEQUE"))
					}
				}
				
				function tran(p, formaSeleccionada, formaPago){
					var idFP =  RunFood.formaPago.getId(p.formaPago);
					if (formaSeleccionada != 'monto'){idFP = RunFood.formaPago.getId(formaPago)}
					tx.executeSql(`INSERT INTO PAGO ( fechaCreacion, idPedido, idComprobante, idCliente, formaPago, documentoTransaccion, monto, tipo) VALUES (datetime('now', 'localtime'),?,?,?,?,?,?,?)`,
						[p.id, p.idComprobante, p.idCliente, idFP, p.documentoTransaccion, p[formaSeleccionada], p.tipo], okP, errP);
				}

			}
			function okP(tx, results){
				p.idCliente = results.insertId;
				console.log('PAGO REGISTRADO: ID ' + results.insertId);
				callback(tx,results, results.insertId);
			}

			function errP(tx, results){
				console.log('Error al crear Pago para idPedido: ' + p.idPedido);
				console.log(results);
				error(tx, results);
			}
		},
		update : function(pago, callback, error){

		},
		delete : function(pago, callback, error){

		},
		get : function(callback, error){

		},
		arqueoCaja : function(inicio, fin, callback, error){
			RunFood.query(`
			SELECT p.id, p.formaPago, p.fechaCreacion, p.tipo, (p.tipo || '1' * monto) monto, pd.id documento
			FROM PAGO p LEFT JOIN
			PEDIDO pd on pd.id = p.id
			ORDER BY pd.fechaCreacion desc, formaPago asc
			`, [], function(tx, results){
				var arr = [];
				for (var i = 0; i < results.rows.length; i++) {
					var row =results.rows[i];
					row.formaPago = RunFood.formaPago.getString(results.rows[i].formaPago);
					row.fechaCreacion = new Date(results.rows[i].fechaCreacion);
					arr.push(row);
				}
				callback(arr, results);
			}, error);
		}
	}

	this.cliente = {
		insert : function(cliente, callback, error, tx){

			if (cliente.telefono == undefined){ cliente.telefono = null}else{cliente.telefono == cliente.telefono.trim()};
			if (cliente.direccion == undefined){ cliente.direccion = null}else{cliente.direccion == cliente.direccion.trim()};
			if (cliente.email == undefined){ cliente.email = null}else{cliente.email == cliente.email.trim()};

			var query = "INSERT INTO CLIENTE (fechaCreacion, cedula, razonSocial, direccion, telefono, email ) VALUES (datetime('now', 'localtime'),?,?,?,?,?)",
			params = [cliente.cedula, cliente.razonSocial, cliente.direccion, cliente.telefono, cliente.email];

			if (tx == undefined){
				RunFood.query(query, params, ok ,err);
			}else{
				tx.executeSql(query, params, ok,err);
			}

			function ok(tx, results){
				cliente.id = results.insertId;
				console.log('CLIENTE CREADO ID: ' + cliente.id);
				callback(tx, results, cliente.id);
			}
			function err(tx, results){
				console.log('Error al crear cliente: ');
				console.log(results);
			}
		},
		getId : function(cliente, callback, error, tx, noCrearNuevo){
			cliente.cedula = cliente.cedula.trim();
			cliente.razonSocial = cliente.razonSocial.trim();

			if (cliente.razonSocial == '' || cliente.cedula == ''){
				cliente.cedula = 9999999999999;
				cliente.razonSocial = 'CONSUMIDOR FINAL';
				cliente.id = 1;
				callback(tx, {message: 'Cliente encontrado'}, 1);
			}else{
				var query = "SELECT id FROM CLIENTE where cedula = ? LIMIT 1";
				var params = [cliente.cedula];
				if (tx == undefined){
					RunFood.query(query, params, ok, err);
				}else{
					tx.executeSql(query, params, ok, err);
				}
				function ok(tx, results){
					if (results.rows.length == 0){
						cliente.id = null;
						console.log('No se encontro cliente con cedula como: ' + cliente.cedula + ' o razonSocial como: ' + cliente.razonSocial);
					}else{
						cliente.id = results.rows[0].id;
						console.log('Cliente encontrado: ID ' + cliente.id);
					};
					if (cliente.id == undefined || cliente.id == null){
						if (noCrearNuevo == true ){
							console.log('NO SE ENCONTRO EL CLIENTE Y NO SE VA A CREAR UNO NUEVO');
						callback(tx, results, cliente.id);
						}else{
							RunFood.cliente.insert(cliente, callback, error, tx);
						}
					}else{
						callback(tx, results, cliente.id);
					}
				}

				function err(tx, results){
					console.log('Error al buscar al cliente: ');
					console.log(results);
					error(tx, results);
				}
			}
		}
	}

	this.comprobante = {
		insert : function(tx, pedido, pago, callback, error){

			var query = `INSERT INTO COMPROBANTE (fechaCreacion, idDocumento, estado, numero, serie1, serie2, base0, baseIva, ivaPorcentaje, iva, total) 
			values (datetime('now', 'localtime'), ?, ?, (SELECT secuencia FROM DOCUMENTO where id = ` + pago.documento + `), ?, ?, ?, ?, ?, ?, ?)`,
			params = [pago.documento, 'A'];

				// SERIE 1, SERIE 2
			if (pago.documento == 1){
				params.push(null,null)
			}else{
				params.push(RunFood.configuracion.serie1, RunFood.configuracion.serie2)
			}

			if (pedido.total == pago.monto){
				params.push(pedido.base0, pedido.baseIva, pedido.ivaPorcentaje, pedido.iva, pedido.total)
			}else{
				// EL PAGO SALIO DE LA SUMA DE ARTICULOS ASIGNADOS
				if (pago.articulosPagar.length > 0){
					var iva = 0,
					base0 = 0,
					base12 = 0,
					total = 0;
					for (var iArt = 0; iArt < pago.articulosPagar.length; iArt++){
						var element = array[iArt];
						if (element.iva > 0 ){
							base12 += element.pvp;
							iva += element.iva;
						}else{
							base0 += element.pvp;
						}

					}
				}else{
					var ppago = round((pago.monto / pedido.total) / 100, 4);
					base0 = round((ppago * pago.base0) / 100),
					base12 = round((ppago * pedido.base12 ) / 100 ),
					iva = round((ppago * pedido.iva ) / 100 )
				}
				params.push(base0, baseIva, pedido.ivaPorcentaje, iva, pago.monto)
				console.log('AL MOMENTO DE HACER LOS CALCULOS EN PEDIDO: ESTE ES EL TOTAL: ' + pago.monto + 'Y ESTE EL TOTAL DE LAS BASES' + (base0 + baseIva + iva))
			}
			if (tx == undefined){
				RunFood.query(query, params, exito, error );
			}else{
				tx.executeSql(query, params, function(tx, results){
					console.log('COMPROBANTE PARA PAGO ' +  pago.razonSocial  + ' $' + pago.monto + ' GUARDADO CON EXITO');
					exito(tx, results);
				}, function(tx, results){
					console.log('Error en el PAGO DE ' +pago.razonSocial + ' $' + pago.monto + ': QUERY= '  + query);
					console.log(results);
					error(tx, results);
				})
			}

			function exito(tx, results){
				tx.executeSql('UPDATE DOCUMENTO set secuencia = secuencia + 1 where id =' + pago.documento, [], function(){console.log('SECUENCIA AUMENTADA')}, function(){console.log('SECUENCIA NO CAMBIADA')});
				var arr = [];
				if (pago.monto == pedido.total){
					arr = pedido.detalle
				}else if(pago.articulosPagar.length > 0){
					 arr = pago.articulosPagar
				}else{
					arr.push[{idArticulo : null, cantidad: 1 , pvp : base0 + baseIva, iva : iva}]
				}
					var id = results.insertId;
					var queryDet = 'INSERT INTO COMPROBANTE_DETALLE (idComprobante, idArticulo, cantidad, precio, iva) VALUES ';
					for (var i = 0; i < arr.length; i++) {
						if (i != 0){
							queryDet += ', '
						};
						var abre = '(';
						var element = arr[i];
						var pr = [];
						pr.push(id, element.id, element.cantidad, element.pvp(), element.iva() )
						queryDet += abre.concat(pr).concat(')');
					}
					tx.executeSql(queryDet, [], function(tx, results){
						console.log('DETALLE DEL COMPROBANTE GUARDADO CON EXITO');
						callback(tx, results, id);
					}, function(tx, results){
						console.log('DETALLE DEL COMPROBANTE GUARDADO CON ERRORES!!!');
						console.log(results);
						error(tx, results);
					})
			}
		},
		insertDetalle : function(comprobante, callback, error){

		},
		insertPago : function(pedido, callback, error){

		},
		anular : function(pedido, callback, error){

		},
		get : function(callback, error){

		}
	}

	this.formaPago = {
		getId : function(texto){
			if (texto == 'EFECTIVO'){
				return 1
			}else if(texto == 'TARJETA CREDITO'){
				return 2
			}else if (texto =='TRANSFERENCIA'){
				return 3
			}else if (texto == 'DEPOSITO'){
				return 4
			}else if (texto == 'CHEQUE'){
				return 5
			}else if (texto == 'DINERO ELECTRONICO'){
				return 6
			}else{
				return null
			}
		},getString : function(id){
			if (id == 1 ){
				return 'EFECTIVO'
			}else if (id ==2 ){
				return 'TARJETA CREDITO'
			}else if (id == 3){
				return 'TRANSFERENCIA'
			}else if (id == 4){
				return 'DEPOSITO'
			}else if (id == 5){
				return 'CHEQUE'
			}else if (id == 6){
				return 'DINERO ELECTRONICO'
			}else{
				return 'NO ENCONTRADO'
			}

		}
	}


	this.init = function(){
		var r  = true ;
	    try{
	     if(window.openDatabase){
	             var shortName   =  'RunFood';
	             var version   =  '1.0';
	             var displayName  =  'RunFood Application';
	             var maxSize   =  2 * 1024 * 1024; // in bytes    20971520	- 20 mb
	              RunFood.db = openDatabase(shortName, version, displayName, maxSize, function(db){
	                    console.log('Base de datos creada: ' + shortName);
	                    console.log(db)
	                });
									RunFood.ActualizarBaseDatos();
	         }else{
						 alert('Este navegador no permite el modo offline, por favor use otro. Su informacion no se guardará');
					 }
	    }catch(e){
	     console.log('ERROR AL CRAR db:' + e);
	    }
	}

	this.query = function(query, params, callback, error){
		var r  = true ;
	    try{
				RunFood.db.transaction(function(tx){
					tx.executeSql(query, params,
						function(tx,response){
						console.log(query + ' Realizado con exito');
						console.log(response);
						callback(tx, response);
					}, function(tx, response){
						console.log('Error de Sqlite3 al ejecutar el query:' + query);
						console.log(response)
						error(tx, response);
					});
				})
	    }catch(e){
				console.log('Exception al ejecutar el query: ' + query);
				console.log(e);
	     error(RunFood.db, e);
	    }
	    return r;
	}

	this.ActualizarBaseDatos = function(){
		RunFood.db.transaction(function(tx){
			tx.executeSql(`CREATE TABLE IF NOT EXISTS LINEA ( id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, fechaCreacion TEXT NOT NULL, descripcion INTEGER NOT NULL UNIQUE, estado INTEGER NOT NULL, token INTEGER, serverID INTEGER )`,
			[], function(tx,results, este1, este2){
				console.log('LINEA TABLE CREADO');
			}, function(tx, results){
				console.log('ERROR AL CREATE LINEA TABLE' + res.code + '= ' + res.message);
			});


			tx.executeSql(`
				CREATE TABLE IF NOT EXISTS ARTICULO ( 'id' INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 'fechaCreacion' TEXT NOT NULL, 'estado' INTEGER NOT NULL, 'idLinea' INTEGER NOT NULL, 'codigo' TEXT NOT NULL UNIQUE, 'descripcion' TEXT NOT NULL UNIQUE, 'pvp1' INTEGER NOT NULL, 'pvp2' INTEGER, 'pvp3' INTEGER, 'pvp4' INTEGER, 'esComponente' INTEGER, 'pagaIva' TEXT, 'categoria' TEXT, 'clase' TEXT, FOREIGN KEY('idLinea') REFERENCES 'LINEA'('id') )
				`, [], function(tx,results, este1, este2){
					console.log('ARTICULO TABLE CREADO');
				}, function(tx, results){
					console.log('ERROR AL CREATE ARTICULO TABLE' + res.code + '= ' + res.message);
				});

			tx.executeSql(`CREATE TABLE IF NOT EXISTS DOCUMENTO (id	INTEGER NOT NULL,descripcion TEXT NOT NULL UNIQUE,secuencia INTEGER NOT NULL DEFAULT 1,	PRIMARY KEY(id));`
				, [], function(tx,results, este1, este2){
					console.log('DOCUMENTO TABLE CREADO');
				}, function(tx, res){
					console.log('ERROR AL CREATE DOCUMENTO TABLE' + res.code + '= ' + res.message);
				});


			tx.executeSql(`
			  CREATE TABLE IF NOT EXISTS ARTICULO_PRODUCTO (fechaCreacion TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'A', 'idArticulo' INTEGER NOT NULL,'cantidad' INTEGER NOT NULL DEFAULT 1, 'idProducto' INTEGER NOT NULL, 'tipo' TEXT NOT NULL DEFAULT 'P',  FOREIGN KEY('idArticulo') REFERENCES 'ARTICULO'('id'), FOREIGN KEY('idProducto') REFERENCES 'ARTICULO'('id') )
			  `, [], function(tx){console.log('ARTICULO_PRODUCTO TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE ARTICULO_PRODUCTO TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`
				CREATE TABLE IF NOT EXISTS CLIENTE ( 'id' INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, fechaCreacion TEXT NOT NULL, 'cedula' TEXT NOT NULL UNIQUE, 'razonSocial' TEXT NOT NULL, 'direccion' TEXT, 'telefono' TEXT, 'email' TEXT, 'token' TEXT, 'serverID' INTEGER )
				`, [], function(tx){console.log('CLIENTE TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE CLIENTE TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`
				CREATE TABLE IF NOT EXISTS PEDIDO ( 'id' INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 'fechaCreacion' TEXT NOT NULL, 'estado' TEXT NOT NULL DEFAULT 'A', 'ordenante' TEXT NOT NULL, 'token' TEXT, 'ServerID' INTEGER, 'tokenAnulacion' TEXT, base0 INTEGER, baseIva INTEGER, iva INTEGER,  total INTEGER )
				`, [], function(tx){console.log('PEDIDO TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE PEDIDO TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`
				CREATE TABLE IF NOT EXISTS PEDIDO_DETALLE ( 'id' INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, 'idPedido' INTEGER NOT NULL, 'idArticulo' INTEGER NOT NULL, 'cantidad' INTEGER NOT NULL, 'valor' INTEGER, 'esComponente' INTEGER, 'productoFinal' INTEGER, 'token' TEXT, 'serverID' INTEGER, FOREIGN KEY('idPedido') REFERENCES 'PEDIDO'('id'), FOREIGN KEY('idArticulo') REFERENCES 'ARTICULO'('id'), FOREIGN KEY('productoFinal') REFERENCES ARTICULO(id) )
				`, [], function(tx){console.log('PEDIDO_DETALLE TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE PEDIDO_TABLE TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`
				CREATE TABLE IF NOT EXISTS PAGO ( id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,idPedido INTEGER NOT NULL, idComprobante INTEGER, fechaCreacion TEXT, estado TEXT NOT NULL DEFAULT 'A', monto INTEGER NOT NULL DEFAULT 1, idCliente INTEGER NOT NULL, formaPago INTEGER NOT NULL, documentoTransaccion INTEGER, token INTEGER, serverID INTEGER, tokenAnulacion TEXT, tipo TEXT NOT NULL DEFAULT '+', FOREIGN KEY(idPedido) REFERENCES PEDIDO(id), FOREIGN KEY(idComprobante) REFERENCES COMPROBANTE(id), FOREIGN KEY(idCliente) REFERENCES CLIENTE(id) )
				`, [], function(tx){console.log('PAGO TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE PAGO TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`
				CREATE TABLE IF NOT EXISTS AJUSTE( id INTEGER PRIMARY KEY AUTOINCREMENT,fechaCreacion TEXT NOT NULL, estado TEXT NOT NULL DEFAULT 'A', tipo TEXT NOT NULL DEFAULT '+', observacion TEXT, token TEXT, serverID INTEGER, tokenAnulacion TEXT )
				`, [], function(tx){console.log('AJUSTE TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE AJUSTE TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`CREATE TABLE IF NOT EXISTS AJUSTE_DETALLE ( id INTEGER PRIMARY KEY AUTOINCREMENT, idAjuste INTEGER NOT NULL, idArticulo INTEGER NOT NULL, cantidad INTEGER NOT NULL, FOREIGN KEY(idAjuste) REFERENCES AJUSTE(id), FOREIGN KEY(idArticulo) REFERENCES ARTICULO(id))`
				, [], function(tx){console.log('AJUSTE_DETALLE TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE AJUSTE_DETALLE TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`CREATE TABLE IF NOT EXISTS COMPROBANTE ( id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, fechaCreacion TEXT NOT NULL, idDocumento TEXT NOT NULL DEFAULT 1, estado TEXT NOT NULL DEFAULT 'A', numero INTEGER NOT NULL UNIQUE, serie1 TEXT DEFAULT '001', serie2 TEXT DEFAULT '001', base0 NUMERIC, baseIva NUMERIC, ivaPorcentaje INTEGER, iva NUMERIC, total NUMERIC, claveAcceso TEXT, autorizacion TEXT, token TEXT, serverID TEXT, tokenAnulacion TEXT, FOREIGN KEY(idDocumento) REFERENCES DOCUMENTO(id));`
				, [], function(tx){console.log('COMPROBANTE TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE COMPROBANTE TABLE' + res.code + '= ' + res.message)});

			tx.executeSql(`CREATE TABLE IF NOT EXISTS COMPROBANTE_DETALLE ( id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, idComprobante INTEGER NOT NULL, idArticulo INTEGER, cantidad NUMERIC NOT NULL DEFAULT 1, precio NUMERIC NOT NULL, iva NUMERIC NOT NULL, FOREIGN KEY(idComprobante) REFERENCES COMPROBANTE(id), FOREIGN KEY(idArticulo) REFERENCES ARTCULO(id));`
				, [], function(tx){console.log('COMPROBANTE_DETALLE TABLE CREADO')}, function(tx,res){	console.log('ERROR AL CREATE COMPROBANTE_DETALLE TABLE' + res.code + '= ' + res.message)});


		 // VISTAS
		 tx.executeSql('DROP VIEW IF EXISTS detalleArticulos',[], function(ttx, results){
			 	console.log('Drop view detalleArticulos hecho');
				ttx.executeSql("CREATE VIEW detalleArticulos AS 	\
								SELECT pdet.idArticulo ,pdet.esComponente usadoComoComponente,	pdet.cantidad detalle,		\
								'-' || IFNULL(pdet.cantidad, 0) detalleConSigno, p.id numero, 'PEDIDO' documento, p.fechaCreacion		\
								FROM 			\
									 PEDIDO_DETALLE pdet INNER JOIN 			\
									 PEDIDO p on p.id = pdet.idPedido		\
								WHERE			\
									(p.estado ='A' or p.estado IS NULL)		\
											\
								UNION		\
										\
								SELECT adet.idArticulo, 0, 	adet.cantidad,	\
								 aj.tipo || ifnull(adet.cantidad, 0) adet, aj.id, case when aj.tipo = '+' then 'AJ. INGRESO' else 'AJ. EGRESO' end, aj.fechaCreacion		\
								FROM 			\
									 AJUSTE_DETALLE adet INNER JOIN 			\
									 AJUSTE aj on aj.id = adet.idAjuste		\
								WHERE	 aj.estado ='A' or aj.estado IS NULL"
					, [], function(tx){console.log('detalleArticulos VIEW CREADO')}, function(tx,res){	console.log('ERROR AL CREATE VIEW detalleArticulos ' + res.code + '= ' + res.message)});
				 },function(tx,res){	console.log('ERROR AL DROP IF EXIST VIEW detalleArticulos' + res.code + '= ' + res.message)} );
		});
		RunFood.db.transaction(
			function(tx){
/*			tx.executeSql(`
				INSERT INTO LINEA (fechaCreacion, descripcion, estado)
				SELECT datetime('now', 'localtime'), 'BEBIDAS', 'A'
				WHERE NOT EXISTS(SELECT 1 FROM LINEA WHERE descripcion = 'BEBIDAS')
				`, [], function(tx, res){
					if (res.rowsAffected > 0 ){console.log('LINEA BEBIDAS CREADA')}else{console.log('ACTUALIZACION DE LINEA BEBIDAS')};
				}, function(tx, res){
					console.log('ERRRO AL CREAR LA LINEA BEBIDA: ' + res.code + '= ' + res.message)
				})
				tx.executeSql(`
				INSERT INTO LINEA (fechaCreacion, descripcion, estado)
					SELECT datetime('now', 'localtime'),'PLATOS', 'A'
					WHERE NOT EXISTS(SELECT 1 FROM LINEA WHERE descripcion = 'PLATOS')
					`, [], function(tx, res){
						if (res.rowsAffected > 0 ){console.log('LINEA PLATOS CREADA')}else{console.log('ACTUALIZACION DE LINEA PLATOS')};
					}, function(tx, res){
						console.log('ERRRO AL CREAR LA LINEA PLATOS: ' + res.code + '= ' + res.message)
					})
					tx.executeSql(`
						INSERT INTO LINEA (fechaCreacion, descripcion, estado)
						SELECT datetime('now', 'localtime'),'PORCIONES', 'A'
						WHERE NOT EXISTS(SELECT 1 FROM LINEA WHERE descripcion = 'PORCIONES')
						`, [], function(tx, res){
						 if (res.rowsAffected > 0 ){console.log('LINEA PORCIONES CREADA')}else{console.log('ACTUALIZACION DE LINEA PORCIONES')};
						}, function(tx, res){
							console.log('ERRRO AL CREAR LA LINEA PORCIONES: ' + res.code + '= ' + res.message)
						});
*/
			tx.executeSql(`
					INSERT  INTO CLIENTE (id, fechaCreacion, cedula, razonSocial, direccion, telefono, email, token, serverID)
					SELECT 1, datetime('now', 'localtime'), '9999999999999', 'CONSUMIDOR FINAL',  '','','','DEFAULT',1
					WHERE NOT EXISTS (SELECT 1 FROM CLIENTE WHERE id = 1)
			`, [], function(tx, res){
				if(res.rowsAffected > 0) {console.log('CONSUMIDOR FINAL CREADO')}
				}, function(tx, err){ console.log('Error al ejecutar la creacion del consumidor final'); console.log(err)});

			tx.executeSql(`
					INSERT  INTO DOCUMENTO (id, descripcion, secuencia)
					SELECT 1, 'NOTA DE VENTA', 1
					WHERE NOT EXISTS (SELECT 1 FROM DOCUMENTO WHERE id = 1)
			`, [], function(tx, res){
				if(res.rowsAffected > 0) {console.log('DOCUMENTO NOTA DE VENTA CREADA')}
				}, function(tx, err){ console.log('Error al ejecutar la creacion del Documento Nota de Venta'); console.log(err)});
		});
	}
}]);


function isNumber(obj) { return !isNaN(parseFloat(obj)) }

function isNumberOrEmpty(obj){
	if (obj == '' || obj == undefined || obj == null){
		return true;
	}else{
		return isNumber(obj)
	}
}

function parseNullableFloat(obj){
	if (obj == null || obj.trim() == ''){
		return 0
	}else if(isNumber(obj)){
		return parseFloat(obj);
	}
}

function round(obj, numeroRound){
	var ceros = numeroRound;
	var unoyCeros = 1;
	if (ceros == undefined){
		ceros = 2
	};
	for (var i = 0; i < ceros; i++) {
	 unoyCeros *= 10;
	};
	return parseFloat(Math.round(obj * unoyCeros) / unoyCeros) 
}

function validarPVP(pvp, i, mayorA0){
	if (isNumberOrEmpty(pvp)){
		if (isNumber(pvp)){
			// VALIDAR QUE EL NUMERO NO SEA MENOR A 0.
			if (parseFloat(pvp) > 0){
				return true
			}else{
				if (parseFloat(pvp) == 0 && mayorA0 == true){
					return 'El PVP' + i + ' debe ser mayor 0'
				}else if(parseFloat(pvp) < 0){
					return 'El PVP' + i + ' debe ser mayor a 0'
				}else{
					// AQUI CAE, CUANDO ES PVP es 0 pero mayorA0 es False o Undefined
					return true
				}
			}
		}else{
			// EL VALOR ES UN WHITESPACE O NULL, ASI QUE NO IMPORTA!
			if (mayorA0 == true){
				return 'Digite el valor para PVP' + i
			}else{
				return true
			}
		}
	}else{
		// EL VALOR ES UNA LETRA O UN SIGNO RANDOM!
		return 'El PVP' + i + ' debe ser un numero'
	}
}


function isEmptyOrNull(obj){
	if (obj === '' || obj == undefined || obj == null || obj == 'undefined'){
		return true
	}else{
		return false;
	}
}


function validarArticulo(articulo){
	var retorno = undefined;
	articulo.descripcion = articulo.descripcion.trim();
	articulo.codigo = articulo.codigo.trim();
	articulo.codigo = articulo.codigo.trim();
	if (articulo.pagaIva == undefined) {
		articulo.pagaIva = false;
	}
	if (isEmptyOrNull(articulo.pvp1)){
		articulo.pvp1 = null
	}
	if (isEmptyOrNull(articulo.pvp2)){
		articulo.pvp2 = null
	}
	if (isEmptyOrNull(articulo.pvp3)){
		articulo.pvp3 = null
	}
	if (isEmptyOrNull(articulo.pvp4)){
		articulo.pvp4 = null
	}
	var resultado1 = validarPVP(articulo.pvp1, 1, true);
	var resultado2 = validarPVP(articulo.pvp2, 2);
	var resultado3 = validarPVP(articulo.pvp3, 3);
	var resultado4 = validarPVP(articulo.pvp4, 4);
	if (articulo.codigo == ''){
		alert('Escriba el codigo del articulo.');
	}else if(articulo.descripcion == ''){
		alert('Escriba la descripcion del articulo');
	}else if(!articulo.idLinea > 0){
		alert('No ha seleccionado ninguna linea');
	}else if(resultado1 != true){
		alert(resultado1);
	}else if(resultado2 != true){
		alert(resultado2);
	}else if(resultado3 != true){
		alert(resultado3);
	}else if(resultado4 != true){
		alert(resultado4);
	}else{
		retorno = articulo;
	}
	return retorno;
}


function castBool(obj){
	if (obj == "true" || obj == 1){
		return true;
	}else{
		return false;
	}
}

function boolToInt(obj){
	if (obj == true){
		return 1;
	}else{
		return 0;
	}
}

function indexFromId(arr, id){
	var ret = undefined;
	if (arr != undefined && id != undefined){
		for (var i = 0; i < arr.length; i++) {
			if (arr[i].id == id ){
				ret = i;
				break;
			}
		}
	}
	return ret;
}



function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}




function validadorCedulaRuc(numero, vacioEstaBien, exito, error){
	var mensaje = '';
	var esValido = false;
	if (vacioEstaBien && isEmptyOrNull(numero)){
		mensaje = '';
		esValido = true;
	}else{
		if (isNumber(numero)){

			var suma = 0;
			var residuo = 0;
			var pri = false;
			var pub = false;
			var nat = false;
			var numeroProvincias = 22;
			var modulo = 11;

			/* Verifico que el campo no contenga letras */
			var ok=1;
			/*for (i=0; i numeroProvincias){
			mensaje = 'El código de la provincia (dos primeros dígitos) es inválido'); esValido = fals;
			} */

			/* Aqui almacenamos los digitos de la cedula en variables. */
			d1 = numero.substr(0,1);
			d2 = numero.substr(1,1);
			d3 = numero.substr(2,1);
			d4 = numero.substr(3,1);
			d5 = numero.substr(4,1);
			d6 = numero.substr(5,1);
			d7 = numero.substr(6,1);
			d8 = numero.substr(7,1);
			d9 = numero.substr(8,1);
			d10 = numero.substr(9,1);

			/* El tercer digito es: */
			/* 9 para sociedades privadas y extranjeros */
			/* 6 para sociedades publicas */
			/* menor que 6 (0,1,2,3,4,5) para personas naturales */

			if (d3==7 || d3==8){
			mensaje = 'El tercer dígito ingresado es inválido';
			esValido = false;
			}

			/* Solo para personas naturales (modulo 10) */
			if (d3 < 6){
			nat = true;
			p1 = d1 * 2; if (p1 >= 10) p1 -= 9;
			p2 = d2 * 1; if (p2 >= 10) p2 -= 9;
			p3 = d3 * 2; if (p3 >= 10) p3 -= 9;
			p4 = d4 * 1; if (p4 >= 10) p4 -= 9;
			p5 = d5 * 2; if (p5 >= 10) p5 -= 9;
			p6 = d6 * 1; if (p6 >= 10) p6 -= 9;
			p7 = d7 * 2; if (p7 >= 10) p7 -= 9;
			p8 = d8 * 1; if (p8 >= 10) p8 -= 9;
			p9 = d9 * 2; if (p9 >= 10) p9 -= 9;
			modulo = 10;
			}

			/* Solo para sociedades publicas (modulo 11) */
			/* Aqui el digito verficador esta en la posicion 9, en las otras 2 en la pos. 10 */
			else if(d3 == 6){
			pub = true;
			p1 = d1 * 3;
			p2 = d2 * 2;
			p3 = d3 * 7;
			p4 = d4 * 6;
			p5 = d5 * 5;
			p6 = d6 * 4;
			p7 = d7 * 3;
			p8 = d8 * 2;
			p9 = 0;
			}

			/* Solo para entidades privadas (modulo 11) */
			else if(d3 == 9) {
			pri = true;
			p1 = d1 * 4;
			p2 = d2 * 3;
			p3 = d3 * 2;
			p4 = d4 * 7;
			p5 = d5 * 6;
			p6 = d6 * 5;
			p7 = d7 * 4;
			p8 = d8 * 3;
			p9 = d9 * 2;
			}

			suma = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
			residuo = suma % modulo;

			/* Si residuo=0, dig.ver.=0, caso contrario 10 - residuo*/
			digitoVerificador = residuo==0 ? 0: modulo - residuo;

			/* ahora comparamos el elemento de la posicion 10 con el dig. ver.*/
			if (pub==true){
			if (digitoVerificador != d9){
			mensaje = 'El ruc de la empresa del sector público es incorrecto.';
			esValido = false;
			}
			/* El ruc de las empresas del sector publico terminan con 0001*/
			if ( numero.substr(9,4) != '0001' ){
			mensaje = 'El ruc de la empresa del sector público debe terminar con 0001';
			esValido = false;
			}
			}
			else if(pri == true){
			if (digitoVerificador != d10){
			mensaje = 'El ruc de la empresa del sector privado es incorrecto.';
			esValido = false;
			}
			if ( numero.substr(10,3) != '001' ){
			mensaje = 'El ruc de la empresa del sector privado debe terminar con 001';
			esValido = false;
			}
			}

			else if(nat == true){
			if (digitoVerificador != d10){
			mensaje = 'El número de cédula de la persona natural es incorrecto.';
			esValido = false;
			}
			if (numero.length >10 && numero.substr(10,3) != '001' ){
			mensaje = 'El ruc de la persona natural debe terminar con 001';
			esValido = false;
			}
			}
			esValido = true;

		}else{
			mensaje = 'Este campo solo admite numeros';
		}
	}

	if (esValido && mensaje == ''){
		exito();
	}else{
		if( mensaje == ''){
			mensaje = 'La cantidad de digitos no corresponde a Cedula o RUC'
		}
		error(mensaje);
	}
}
