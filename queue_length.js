var http = require('http'),
    url = require('url'),
    redis = require("redis"),
    config = require('./config');

var redis_pro = redis.createClient(config.redis_pro_port, config.redis_pro);
var redis_cons = redis.createClient(config.redis_cons_port, config.redis_cons);
var num_queues=0;
var response_text={};
var dummy_increment=0;

http.createServer(function (req, res) {
   if(req.method == 'GET') {
      handle_query(req, res);
   }
   else {
      res.statusCode = 405; // method not allowed
      res.end();
   }
}).listen(config.port);

function handle_query(req, resp) {
  num_queues=0;
  response_text={};
  var current_queue_item=0;
  
  var  urlParsed = url.parse(req.url, true);
  if(urlParsed.pathname == '/queue_length') {
    var qName = urlParsed.query['queue_name'];
//check if they added a comma
if (qName.contains(",")) {
var qNames=explode (',',qName);
var queue_name="";

 num_queues=qNames.length - 1;
 
//	resp.statusCode = 200;
	for (var i=0;i < qNames.length;i++){ 
        queue_name=qNames[i] + "_queue";
        current_queue_item=i;       
        query_queue_length(redis_pro, queue_name,current_queue_item, function(err, len,qname,current_queue_item) {
        multipleQueueResponse(qname,resp,err, len,current_queue_item);
        });
	}
}
else  //this is what gets run on a single queue call
{
	query_queue_length(redis_pro, qName + "_queue",current_queue_item, function(err, len,qname,current_queue_item) {
        cookResponse(qname,resp, err, len,current_queue_item);
});
  }
}
  else {
    resp.statusCode = 400;
    resp.end();
  }

}
function multipleQueueResponse(qName,resp, err, len,current_queue_item) {
  if(err) {
    resp.statusCode = 500;
    resp.write(err);
  }
  else {
    resp.statusCode = 200;
   response_text[qName]= len;
   //console.log(response_text);
   }
  
  if (current_queue_item==num_queues)
  {
//          response_text+="dummy_queue length="+dummy_increment;
 //         dummy_increment++;i
  var output=JSON.stringify(response_text);

	  resp.write(output);
	  resp.end();
  }
 
}
function cookResponse(qName,resp, err, len,current_queue_item) {
  if(err) {
    resp.statusCode = 500;
    resp.write(err);
  }
  else {
    resp.statusCode = 200;
    //console.log(qName + " length=" + len);
    resp.write(qName + " length=" + len);
    resp.end();
  }
//  resp.end();
}

function query_queue_length(redis_client, name,current_queue_item, callback) {
  redis_client.llen(name, function(err, len) {
    if(!err) {
      console.log("len=" + len);
      callback(null, len,name, current_queue_item);
    }
    else {
      callback(err, null);
    }
  });
}
function explode (delimiter, string, limit) {

  if ( arguments.length < 2 || typeof delimiter == 'undefined' || typeof string == 'undefined' ) return null;
  if ( delimiter === '' || delimiter === false || delimiter === null) return false;
  if ( typeof delimiter == 'function' || typeof delimiter == 'object' || typeof string == 'function' || typeof string == 'object'){
    return { 0: '' };
  }
  if ( delimiter === true ) delimiter = '1';
  
  // Here we go...
  delimiter += '';
  string += '';
  
  var s = string.split( delimiter );
  

  if ( typeof limit === 'undefined' ) return s;
  
  // Support for limit
  if ( limit === 0 ) limit = 1;
  
  // Positive limit
  if ( limit > 0 ){
    if ( limit >= s.length ) return s;
    return s.slice( 0, limit - 1 ).concat( [ s.slice( limit - 1 ).join( delimiter ) ] );
  }

  // Negative limit
  if ( -limit >= s.length ) return [];
  
  s.splice( s.length + limit );
  return s;
}
String.prototype.contains = function(substr) {
  return this.indexOf(substr) > -1;
}