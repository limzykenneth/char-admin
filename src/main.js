const siteTitle = "Char Admin"
const url = "http://localhost:3001/api";

const Vue = require("vue");
const Vuex = require("vuex");
Vue.use(Vuex);
const urljoin = require('url-join');

var appStore = new Vuex.Store({
	state: {
		loggedIn: false,
		schemas: [],
		usersList: [],

		currentContentView: "app-dashboard",
		currentCollection: {},
		currentCollectionSchema: {}
	},
	mutations: {
		updateSchemas: function(state, newSchemas){
			state.schemas = newSchemas;
		},
		updateUsersList: function(state, newUsersList){
			state.usersList = newUsersList;
		},
		setContentView: function(state, view){
			state.currentContentView = view;
		},
		setLoggedIn: function(state, loggedIn){
			state.loggedIn = loggedIn;
		},
		setCurrentCollection: function(state, result){
			state.currentCollection = result.collection;
			state.currentCollectionSchema = _.find(state.schemas, function(el){
				return el.collectionSlug == result.collectionSlug;
			});
		}
	},
	actions: {
		fetchSchemas: function(context){
			var request = generateRequest("schema");
			fetch(request).then((res) => res.json()).then(function(schemas){
				if(schemas.errors && schemas.errors.length > 0){
					context.commit("setLoggedIn", false);
					context.commit("updateSchemas", []);

					_.each(schemas.errors, function(error){
						if(error.title !== "Auth Token Invalid"){
							throw new Error(error);
						}else{
							context.commit("setContentView", "login-page");
						}
					});
				}else{
					context.commit("updateSchemas", schemas);
					context.commit("setLoggedIn", true);
				}
			});
		},
		fetchUsersList: function(context){
			var request = generateRequest("users");
			fetch(request).then((res) => res.json()).then((users) => {
				context.commit("updateUsersList", users);
			});
		},
		fetchInitialData: function(context){
			context.dispatch("fetchSchemas");
			context.dispatch("fetchUsersList");
		},
		fetchCollection: function(context, collectionSlug){
			var request = generateRequest(`collections/${collectionSlug}`);
			fetch(request).then((res) => res.json()).then((collection) => {
				context.commit("setCurrentCollection", {
					collection,
					collectionSlug
				});
			})
		}
	}
});

var App = require("./App.vue");
App.data = function(){
	return {
		siteTitle: siteTitle,
		serverURL: url,

		contentViews: {
			dashboard: "app-dashboard",
			schemasList: "schemas-list",
			collectionList: "collection-list"
		},

		utils: {
			generateRequest: generateRequest
		}
	};
};

App.computed = {
	loggedIn: function(){
		return appStore.state.loggedIn;
	},
	schemas: function(){
		return appStore.state.schemas;
	},
	usersList: function(){
		return appStore.state.usersList;
	},
	currentContentView: function(){
		return appStore.state.currentContentView;
	},
	currentCollection: function(){
		return appStore.state.currentCollection;
	},
	currentCollectionSchema: function(){
		return appStore.state.currentCollectionSchema;
	}
};

new Vue({
	el: "#page-content",
	store: appStore,
	render: function(h){
		appStore.dispatch("fetchUsersList");
		appStore.dispatch("fetchSchemas");
		return h(App);
	}
});

function generateRequest(path, method="GET", payload=null){
	var finalURL = urljoin(url, path);
	var token = store.get("access_token");

	var header = {};
	header["Content-Type"] = "application/json";
	if(path !== "token/generate_new_token"){
		header["Authorization"] = `Bearer ${token}`;
	}

	var body;
	if(payload !== null){
		body = JSON.stringify(payload);
	}

	var request = new Request(finalURL, {
		method: method,
		body: body,
		headers: new Headers(header)
	});

	return request;
}