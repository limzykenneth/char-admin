var $ = require("jquery");
// require other libraries after this line
var _ = require("underscore");
var Backbone = require("backbone");
Backbone.$ = $;

var charCollection = require("./collection.js");

var router = Backbone.Router.extend({
	initialize: function(schemas){
		_.each(schemas, function(el, i){
			this.route(el.collectionSlug, el.collectionName, function(){
				fetch(`${window.host}/api/collections/${el.collectionSlug}`, {
					headers: window.fetchHeaders
				}).then(function(response){
					return response.json();
				}).then(function(col){
					var schema = el;
					var collection = new charCollection(col);
					var tpl = _.template($("#models-list-template").html());
					$("#page-content .main-content").html(tpl({
						data: collection.toJSON(),
						collectionSlug: el.collectionSlug,
						collectionName: el.collectionName
					}));
					console.log(collection.toJSON());

					// Render collection
				});
			});
		}, this);
	}
});

module.exports = router;