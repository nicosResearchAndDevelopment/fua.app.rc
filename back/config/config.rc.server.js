exports.schema   = 'http';
exports.hostname = String(process.env.SERVER_HOST || 'localhost');
exports.port     = Number(process.env.SERVER_PORT || 8099);
exports.options  = {};
