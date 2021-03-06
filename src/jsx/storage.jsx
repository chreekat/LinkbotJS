var settings = {
    DBNAME: "robotsdb",
    DBVER: 1.0,
    DBDESC: "Robots Database, used for persistance",
    TABLE: "robots"
};
var db = null;
try {
    db = openDatabase(settings.DBNAME, settings.DBVER, settings.DBDESC, settings.DBSIZE);
} catch(e) {
    db = null;
    // TODO implement alternative storage engines.
    module.exports.remove = function() {
        window.console.log('OpenDatabase not available');
    };
    module.exports.add = function() {
        window.console.log('OpenDatabase not available');
    };
    module.exports.getAll = function() {
        window.console.log('OpenDatabase not available');
    };
    module.exports.updateOrder = function() {
        window.console.log('OpenDatabase not available');
    };
    module.exports.changePosition = function() {
        window.console.log('OpenDatabase not available');
    };
}
if (db !== null) {
    db.transaction(function(tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS " + settings.TABLE + " (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT unique not null, status INTEGER not null, rorder INTEGER not null)",
            [],
            function(tx, results) {
            },
            function(tx, error) {
                console.log(error);
            }
        );
    });
    module.exports.remove = function(name, callback) {
        db.transaction(function(tx) {
            tx.executeSql("DELETE FROM " + settings.TABLE + " WHERE name = ?", [name],
                function() {
                    if (callback) {
                        callback(true);
                    }
                },
                function(tx, error) {
                    if (callback) {
                        callback(false, error);
                    }
                });
        });
    };
    module.exports.add = function(name, status, callback) {
        db.transaction(function(tx) {
            tx.executeSql("SELECT COUNT(*) AS c FROM " + settings.TABLE, [],
                function(tx, countResult) {
                    tx.executeSql("INSERT INTO " + settings.TABLE + " (name, status, rorder) values (?,?,?)", [name, status, countResult.rows.item(0).c],
                        function(tx, insertResult) {
                            if (callback) {
                                callback(true);
                            }
                        },
                        function(tx, insertError) {
                            if (callback) {
                                callback(false, insertError);
                            }
                        });
                },
                function(tx, error) {
                    if (callback) {
                        callback(false, error);
                    }
                });
        });
    };
    module.exports.getAll = function(callback) {
        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM " + settings.TABLE + " ORDER BY rorder", [],
                function(tx, result) {
                    var rows = result.rows;
                    var allRobots = [];
                    for (var i = 0; i < result.rows.length; i++) {
                        allRobots.push({ "id":rows.item(i).id, "name": rows.item(i).name, "status":rows.item(i).status, "order":rows.item(i).rorder});
                    }
                    if (callback) {
                        callback(allRobots);
                    }
                },
                function(tx, error) {
                    if (callback) {
                        callback([], error);
                    }
                });
        });
    };
    module.exports.updateOrder = function(callback) {
        db.transaction(function(tx) {
            tx.executeSql("SELECT id FROM " + settings.TABLE + " ORDER BY rorder", [],
                function(tx, result) {
                    var success = function(tx, results) {}; // do nothing
                    var error = function(tx, error) {
                        if (callback) {
                            callback(false, results);
                        }
                    };
                    for (var i = 0; i < result.rows.length; i++) {
                        tx.executeSql("UPDATE " + settings.TABLE + " SET rorder = ? WHERE id = ?", [i, result.rows.item(i).id],
                            success,
                            error);
                    }
                    if (callback) {
                        callback(true);
                    }
                },
                function(tx, error) {
                    if (callback) {
                        callback(false, results);
                    }
                });
        });
    };
    module.exports.changePosition = function(currentPosition, newPosition, callback) {
        if (currentPosition === newPosition) {
            return;
        }
        db.transaction(function(tx) {
            var start = currentPosition;
            var end = newPosition;
            if (currentPosition > newPosition) {
                start = newPosition;
                end = currentPosition;
            }
            tx.executeSql("SELECT * from " + settings.TABLE + " WHERE rorder BETWEEN ? and ? ORDER BY rorder", [start, end],
                function(tx, result) {
                    var i = 0;
                    var _modifier = -1;
                    var rows = result.rows;
                    if (currentPosition > newPosition) {
                        _modifier = 1;
                    }
                    var success = function(tx, results) {
                        if (callback) {
                            callback(true, results);
                        }
                    };
                    var error = function(tx, error) {
                        if (callback) {
                            callback(false, results);
                        }
                    };
                    for (i = 0; i < result.rows.length; i++) {
                        var setorder = rows.item(i).rorder + _modifier;
                        var setid = rows.item(i).id;
                        if (rows.item(i).rorder == currentPosition) {
                            setorder = newPosition;
                        }
                        tx.executeSql("UPDATE " + settings.TABLE + " SET rorder = ? WHERE id = ?", [setorder, setid],
                            success,
                            error);
                    }
                    if (callback) {
                        callback(true);
                    }
                },
                function(tx, error) {
                    if (callback) {
                        callback(false,error);
                    }
                });
        });
    };
}