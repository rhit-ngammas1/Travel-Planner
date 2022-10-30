
/** namespace. */
var rhit = rhit || {};
rhit.storage = rhit.storage || {};
const db = firebase.firestore();

/** globals */
rhit.variableName = "";
rhit.FB_COL_CITY = 'cities';
rhit.FB_COLLECTION_PLAN='plans';
rhit.FB_COLLECTION_ROUTE='routes';
rhit.FB_KEY_CITY_ID = 'cityId';
rhit.FB_KEY_CITY_NAME = 'cityName';
rhit.FB_KEY_START_CITY_ID = 'startCityId';
rhit.FB_KEY_END_CITY_ID = 'endCityId';
rhit.FB_KEY_START_CITY_NAME = 'startCityName';
rhit.FB_KEY_END_CITY_NAME = 'endCityName';
rhit.FB_KEY_NAME= 'name';
rhit.FB_KEY_START_DATE='startDate';
rhit.FB_KEY_END_DATE='endDate';
rhit.FB_KEY_BUDGET='budget';
rhit.FB_KEY_DESCRIPTION='description';
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_AUTHOR = "author";

rhit.storage.PLAN_ID_KEY = "planId";

rhit.pageController = null;
rhit.fbAuthManager = null;
rhit.cityManager = null;
rhit.planManager = null;
rhit.planDetailsManager = null;
rhit.routeManager = null;

rhit.storage.getPlanId = function() {
	const planId = sessionStorage.getItem(rhit.storage.PLAN_ID_KEY);
	if(!planId){
		console.log("No plan id");
	}
	return planId;
};
rhit.storage.setPlanId = function(planId){
	sessionStorage.setItem(rhit.storage.PLAN_ID_KEY, planId);
};


function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
   }

//main page controller
rhit.MapPageController = class {

	constructor() {
		this.planManager = rhit.planManager;
		this.routeManager = rhit.routeManager;
		this.planManager.beginListening(this.updatePinColor.bind(this));
		this.routeManager.beginListening(this.updateRouteDisplay.bind(this));
		this.initializePopover();
		this.initializeModal();
		
		// document.querySelector("#startRoute").addEventListener("click", (event) => {
		// 	const startCity = document.querySelector("#cityPlanName").value;
		// });

	}

	initializePopover = () => {
		$('[data-toggle="popover"]').on('shown.bs.popover', (event) => {
			const target_po = event.target.getAttribute('aria-describedby');
			const target_city_id = event.target.dataset.pinCityId;
			const target_city_name = event.target.dataset.pinCityName;
			let btn_grp = null;
			if (this.routeManager.routeState == 0) {
				btn_grp = `
					<div class="container justify-content-center">
						<div class='city-btn'><button class="btn btn-primary btn-sm city-detail-btn" style="margin: 4px 0px 2px 0px; width: 100%" data-bs-toggle="modal" data-bs-target="#cityDetailModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Detail</button></div>
						<div class='city-btn'><button class="btn btn-success btn-sm add-dest-btn" style="margin: 2px 0px 2px 0px; width: 100%" data-bs-toggle="modal" data-bs-target="#addDestModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Create Plan</button></div>
						<div class='city-btn'><button class="btn btn-danger btn-sm start-route-btn" style="margin: 2px 0px 4px 0px; width: 100%" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Start Route</button></div>
						<div class='city-btn'><button class="btn btn-danger btn-sm end-route-btn" style="margin: 2px 0px 4px 0px; width: 100%; display: none;" data-bs-toggle="modal" data-bs-target="#addRouteModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">End Route</button></div>
					</div>  
					`
			} else if (this.routeManager.routeState == 1) {
				btn_grp = `
					<div class="container justify-content-center">
						<div class='city-btn'><button class="btn btn-primary btn-sm city-detail-btn" style="margin: 4px 0px 2px 0px; width: 100%" data-bs-toggle="modal" data-bs-target="#cityDetailModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Detail</button></div>
						<div class='city-btn'><button class="btn btn-success btn-sm add-dest-btn" style="margin: 2px 0px 2px 0px; width: 100%" data-bs-toggle="modal" data-bs-target="#addDestModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Create Plan</button></div>
						<div class='city-btn'><button class="btn btn-danger btn-sm start-route-btn" style="margin: 2px 0px 4px 0px; width: 100%; display: none;" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Start Route</button></div>
						<div class='city-btn'><button class="btn btn-danger btn-sm end-route-btn" style="margin: 2px 0px 4px 0px; width: 100%;" data-bs-toggle="modal" data-bs-target="#addRouteModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">End Route</button></div>
					</div>  
					`
			}
			
			
			$(`#${target_po}`).append(btn_grp);

			$('.city-detail-btn').on('click', (event) => {
				this.fetchCityInfo(event.target.dataset.cityId);
			})

			$('.add-dest-btn').on('click', (event) => {
				this.prepareAddDestModal(event.target.dataset.cityId, event.target.dataset.cityName);
			})

			$('.start-route-btn').on('click', (event) => {
				
				if (this.routeManager.routeState == 0)
					$('.start-route-btn, .end-route-btn').toggle();
				this.routeManager.routeState = 1;
				this.routeManager.startCityId = event.target.dataset.cityId;
				this.routeManager.startCityName = event.target.dataset.cityName;
			})

			$('.end-route-btn').on('click', (event) => {
				
				if (this.routeManager.routeState == 1)
					$('.start-route-btn, .end-route-btn').toggle();
					this.routeManager.routeState = 0;
					this.routeManager.endCityId = event.target.dataset.cityId;
					this.routeManager.endCityName = event.target.dataset.cityName;
				this.prepareAddRouteModal();
			})

		  })
	}


	initializeModal = () => {
		$('.modal').on('show.bs.modal', (event) => {
			$('[data-toggle="popover"]').popover('hide');
		})

		$('#cityDetailModal').on('hidden.bs.modal', (event) => {
			$('#cityDetailModal .carousel-item').remove();
			$('#cityDetailModal .city-detail-title').html(" ");
			$('#cityDetailModal .city-detail-intro').html(" ");
		})

		$('#addDestModal').on('hidden.bs.modal', (event) => {
			$('#addDestModal .add-dest-title').html(" ");
			$('#addDestModal .form-group input,textarea').val('');
		})

		$('#addRouteModal').on('hidden.bs.modal', (event) => {
			$('#addRouteModal .add-route-title').html(" ");
			$('#addRouteModal .form-group input,textarea').val('');
		})

		document.querySelector("#submitAddPlan").addEventListener("click", (event) => {
			const cityId = $('#addDestModal').attr('data-city-id');
			const cityName = $('#addDestModal').attr('data-city-name');
			const name = document.querySelector("#cityPlanName").value;
			const startDate = document.querySelector("#cityPlanStartDate").value;
			const endDate = document.querySelector("#cityPlanEndDate").value;
			const budget = document.querySelector("#cityPlanBudget").value;
			const description = document.querySelector("#cityPlanDescription").value;
			rhit.planManager.add(cityId, cityName, name,startDate,endDate,budget,description);
		});

		$('#submitAddRoute').on('click', (event) => {
			const name = $('#routeName').val(); 	
			const startDate = $('#routeStartDate').val();
			const endDate = $('#routeEndDate').val();
			const budget = $('#routeBudger').val();
			const description = $('#routeDescription').val();
			rhit.routeManager.add(name, startDate, endDate, budget, description);
		})
		
	}

	updatePinColor = () => {
		for (const city of this.planManager.cityList) {
			const cityId = city.get(rhit.FB_KEY_CITY_ID);
			$(`.pinpoint[data-pin-city-id=${cityId}]`).attr("src", "imgs/redpin_9_14.jpg" );
		}
	}

	updateRouteDisplay = () => {
		console.log("routes updated");
	}

	fetchCityInfo = (cityId) => {
		//$('#cityDetailModal .modal-title').html(cityId);
		this.cityManager.getCity(cityId).then(result => this.prepareCityDetailModal(result)); 
	}

	prepareCityDetailModal(cityInfo) {
		$('#cityDetailModal .city-detail-title').html(cityInfo.name);
		console.log(cityInfo.info);
		const newInfo = cityInfo.info.replaceAll('\\n', '\n');
		//console.log(newInfo);
		$('#cityDetailModal .city-detail-intro').html(newInfo);
		$('#cityDetailModal .city-detail-intro').attr('style', 'white-space: pre-line')
		
		for(const imgLink of cityInfo.imgSrc) {
			const carouselItem = `
			<div class="carousel-item">
				<img src="${imgLink}" class="d-block w-100" alt="${cityInfo.name} picture">
		  	</div>
			`
			$('#cityDetailModal .city-detail-carousel .carousel-inner').append(carouselItem);
		}

		$('#cityDetailModal .city-detail-carousel .carousel-item').first().addClass('active');
		
	}

	prepareAddRouteModal(cityId, cityName) {
		$('#addRouteModal .add-route-title').html(`Adding a route plan from ${this.routeManager.startCityName} to ${this.routeManager.endCityName}`);
	}

	prepareAddDestModal = (cityId, cityName) => {
		$('#addDestModal .add-dest-title').html('Adding a travel plan to ' + cityName);
		$('#addDestModal').attr('data-city-id', cityId);
		$('#addDestModal').attr('data-city-name', cityName);
	}



	// updateListener = () => {
	// 	this.updatePinColor();
	// 	this.updateRouteDisplay();
	// }
	

}

//main page model
rhit.CityManager = class {

	constructor() {
		this.cityCollection = db.collection(rhit.FB_COL_CITY);
		this._unsubcribe = null;
	}
	
	async getCity(Id) {

		const cityRef = this.cityCollection.doc(String(Id));
		const doc = await cityRef.get();
		if (!doc.exists) {
			console.err('No such city');
			return null;
		} else {
			// return new Promise((resolve, reject) => {
			// 	resolve(doc.data());
			// })
			return doc.data();
		}
	}
}

rhit.Plan = class {
	constructor(id, cityId, cityName, name, startDate, endDate, budget, description, author, timestamp) {
		this.id = id;
		this.cityId = cityId; 
		this.cityName = cityName;
		this.name = name;
		this.startDate = startDate;
		this.endDate = endDate;
		this.budget = budget;
		this.description = description;
		this.author = author;
		this.timestamp = timestamp;
	}
}

rhit.PlanDetailsManager  = class {
	constructor(planId) {
	  this._documentSnapshot = {};
	  this._unsubscribe = null;
	  this._planDoc = firebase.firestore().collection(rhit.FB_COLLECTION_PLAN).doc(planId);
	  this.planId = planId;
	}

	beginListening(updateListener) {
		this._unsubscribe = this._planDoc.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				console.log("User ID:", this.uid);
				this._documentSnapshot = doc;
				updateListener();
			} else {
				console.log("No such document!");
			}
		});
	}
	stopListening() {
	  this._unsubscribe();
	}
	edit(startDate, endDate, budget, description){
		console.log(`Document being edited: ${this._planDoc}`)
		this._planDoc.update({
			[rhit.FB_KEY_START_DATE]: startDate,
			[rhit.FB_KEY_END_DATE]: endDate,
			[rhit.FB_KEY_BUDGET]: budget,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		});
		// .then((docRef) => {
		// 	console.log("Plan edited with ID: ", docRef.id);
		// })
		// .catch((error) => {
		// 	console.error("Error editing plan: ", error);
		// });
	}
	delete() {
		return this._planDoc.delete();
	}

	get startDate() {
		return this._documentSnapshot.get(rhit.FB_KEY_START_DATE);
	}
	get endDate() {
		return this._documentSnapshot.get(rhit.FB_KEY_END_DATE);
	}
	get budget() {
		return this._documentSnapshot.get(rhit.FB_KEY_BUDGET);
	}
	get description() {
		return this._documentSnapshot.get(rhit.FB_KEY_DESCRIPTION);
	}
   }

rhit.PlanManager = class {
	constructor(uid) {
		this._uid = uid;
		this.planCollection = firebase.firestore().collection(rhit.FB_COLLECTION_PLAN);
		this._unsubcribe = null;
		this.cityList = [];
	}

	beginListening(updateListener) {
		if(this._uid){ // run if not null
			query = query.where(rhit.FB_KEY_AUTHOR,"==",this._uid);
		}
		this._unsubcribe = this.planCollection
		.limit(50)
		.onSnapshot((docSnapshot) => {
			this.cityList = docSnapshot.docs;	//does this add a new document/plan to the list of cities that have a plan?
			console.log("DocSnapshot.docs: ", docSnapshot.docs);
			
			docSnapshot.forEach((doc) => {  //for each doc in the collection, print data
				console.log(doc.data());
			});

			updateListener();
		})
	}
	// stopListening() {             needed?
	// 	this._unsubscribe();		
	// }

	add(cityId, cityName, name,startDate,endDate,budget,description){
		this.planCollection.add({
			[rhit.FB_KEY_CITY_ID]: cityId,
			[rhit.FB_KEY_CITY_NAME]: cityName,
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_START_DATE]: startDate,
			[rhit.FB_KEY_END_DATE]: endDate,
			[rhit.FB_KEY_BUDGET]: budget,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
		.then((docRef) => {
			console.log("Plan written with ID: ", docRef.id);
		})
		.catch((error) => {
			console.error("Error adding plan: ", error);
		});
	}

	getPlanAtIndex(index) {   
		const docSnapshot = this.cityList[index];
		const plan = new rhit.Plan(docSnapshot.id, 
									docSnapshot.get(rhit.FB_KEY_CITY_ID), 
									docSnapshot.get(rhit.FB_KEY_CITY_NAME), 
									docSnapshot.get(rhit.FB_KEY_NAME),
									docSnapshot.get(rhit.FB_KEY_START_DATE),
									docSnapshot.get(rhit.FB_KEY_END_DATE),
									docSnapshot.get(rhit.FB_KEY_BUDGET),
									docSnapshot.get(rhit.FB_KEY_DESCRIPTION),
									docSnapshot.get(rhit.FB_KEY_AUTHOR),
									docSnapshot.get(rhit.FB_KEY_LAST_TOUCHED)
									);
		return plan;
	}

	get length() {    
		return this.cityList.length;
	}



}

rhit.RouteManager = class {
	constructor(uid) {
		this.routeState = 0;
		this.startCityId = null;
		this.startCityName = null;
		this.endCityId = null;
		this.endCityName = null;
		this._uid = uid;
		this.routeCollection = firebase.firestore().collection(rhit.FB_COLLECTION_ROUTE);
		this._unsubcribe = null;
		this.routeList = [];
	}

	beginListening(updateListener) {
		if(this._uid){ // run if not null
			query = query.where(rhit.FB_KEY_AUTHOR,"==",this._uid);
		}
		this._unsubcribe = this.routeCollection
		.limit(50)
		.onSnapshot((docSnapshot) => {
			this.routeList = docSnapshot.docs;
			console.log(docSnapshot.docs);
			updateListener();
		})
	}

	add( name,startDate,endDate,budget,description){
		if (budget == undefined) 
			budget = "0";
		this.routeCollection.add({
			[rhit.FB_KEY_START_CITY_ID]: this.startCityId,
			[rhit.FB_KEY_START_CITY_NAME]: this.startCityName,
			[rhit.FB_KEY_END_CITY_ID]: this.endCityId,
			[rhit.FB_KEY_END_CITY_NAME]: this.endCityName,
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_START_DATE]: startDate,
			[rhit.FB_KEY_END_DATE]: endDate,
			[rhit.FB_KEY_BUDGET]: budget,
			[rhit.FB_KEY_DESCRIPTION]: description,
			[rhit.FB_KEY_AUTHOR]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
		.then((docRef) => {
			console.log("route written with ID: ", docRef.id);
		})
		.catch((error) => {
			console.error("Error adding route: ", error);
		});
	}

	// set routeState(state) {
	// 	this.routeState = state;
	// }

	// set routeStartCityId(id) {
	// 	this.routeStartCityId = id;
	// }

	// set routeStartCityName(name) {
	// 	this.routeStartCityName = name;
	// }

	// set routeEndCityId(id) {
	// 	this.routeEndCityId = id;
	// }

	// set routeEndCityName(name) {
	// 	this.routeEndCityName = name;
	// }

	// get routeState() {
	// 	return this.routeState;
	// }

	// get routeStartCityId() {
	// 	return this.routeStartCityId;
	// }

	// get routeStartCityName() {
	// 	return this.routeStartCityName;
	// }

	// get routeEndCityId() {
	// 	return this.routeEndCityId;
	// }

	// get routeEndCityName() {
	// 	return this.routeEndCityName;
	// }
}


rhit.city = class {
	constructor(id, name, imgSrc, info) {
		this.id = id;
		this.name = name;
		this.imgSrc = imgSrc;
		this.info = info;
	}
}

rhit.ListPageController = class {
	//initialize modal as well?
	constructor(){
		document.querySelector("#planDoneButt").addEventListener("click", (event) => {
			const startDate = document.querySelector("#startDateInput").value;
			const endDate = document.querySelector("#endDateInput").value;
			const budget = document.querySelector("#budgetInput").value;
			const description = document.querySelector("#descripInput").value;
			
			const planId = rhit.storage.getPlanId();
			rhit.planDetailsManager = new rhit.PlanDetailsManager(planId);
			rhit.planDetailsManager.edit(startDate, endDate, budget, description);
		});
		rhit.planManager.beginListening(this.updateList.bind(this));

		document.querySelector("#myMapButt").addEventListener("click", (event) => {
			window.location.href="/map.html"
		});
		document.querySelector("#myPlansButt").addEventListener("click", (event) => {
			window.location.href="/plan.html"
		});
		document.querySelector("#signOutMenuButt").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		
	}

	//Update Viewer
	updateList(){
		const newList = htmlToElement('<div id="pinContainer1"></div');		//make number a var, corresponding to each of the 12 months

		for (let i = 0; i < rhit.planManager.length; i++){
			const plan = rhit.planManager.getPlanAtIndex(i);
			const newCard = this._createCard(plan);

			newCard.onclick = (event) => {						
				console.log("Clicked on card with id: ", plan.id);
				rhit.storage.setPlanId(plan.id);
				this.updateModalDetails(plan);
			};

			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#pinContainer1");		//will have to do for multiple pinContainers
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
	updateModalDetails(plan) {  
		document.querySelector("#detailModalTitle").innerHTML = `${plan.cityName} Plan`; 
		document.querySelector("#startDateInput").value = plan.startDate;
		document.querySelector("#endDateInput").value = plan.endDate;
		document.querySelector("#budgetInput").value = plan.budget;
		document.querySelector("#descripInput").value = plan.description;
	}

	//Helper Functions
	_createCard(plan) {
		return htmlToElement(`
			<div>
				<div class="pin" data-toggle="modal" data-target="#planDetails">
					<div>
						<img src='https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Wiki_training_0226.jpg/213px-Wiki_training_0226.jpg'
							class='iconDetails'>
					</div>
					<div style='margin-left:120px;'>
						<h4 class="title">${plan.cityName} Plan</h4>
						<span class="startDate" style="font-size:1em">Start Date- </span>
						<span class="startDateValue" style="font-size:1em">${plan.startDate}</span>
						<div></div>
						<span class="budget" style="font-size:1em">Budget- </span>
						<span class="budgetValue" style="font-size:1em">$${plan.budget}</span>
					</div>
					<button id="fab" type="button" class="btn bmd-btn-fab">
						<i class="material-icons">close</i>
					</button>
				</div>
				<hr>
			</div>
		`)
	}

};


rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#rosefireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		}
	}
}

rhit.FbAuthManager = class { //scaffolding always changes
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		console.log("Sign in using Rosefire");
		Rosefire.signIn("9dc0940e-ea6b-4a43-9fb1-873b6cff11b8", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);

			firebase.auth().signInWithCustomToken(rfUser.token)
			.catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				  } else {
					console.error("Custom auth error", errorCode, errorMessage);
				  }
			});
		});

	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}
rhit.checkForRedirects = function(){
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn){
		window.location.href="/map.html"
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn){
		window.location.href="/index.html"
	}
}


/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	const urlParams = new URLSearchParams(window.location.search);
	rhit.fbAuthManager = new rhit.FbAuthManager();
	
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn = ",rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		if (document.querySelector("#loginPage")) {
			console.log("You are on the login page.");
			new rhit.LoginPageController();
		}
	});

	
	if (document.querySelector("#planPage")) {
		console.log("You are on the Plans and Routes page.");

		const uid = urlParams.get("uid"); //search for keyword "uid" in the url
		rhit.cityManager = new rhit.CityManager();
		rhit.planManager = new rhit.PlanManager(uid);
		rhit.routeManager = new rhit.RouteManager(uid);
		rhit.pageController = new rhit.ListPageController();
	}
	if (document.querySelector("#mainPage")) {
		console.log("You are on the map page.");

		const uid = urlParams.get("uid"); //search for keyword "uid" in the url
		rhit.cityManager = new rhit.CityManager();
		rhit.planManager = new rhit.PlanManager(uid);
		rhit.routeManager = new rhit.RouteManager(uid);
		rhit.pageController = new rhit.MapPageController();
	}
	
	$(document).ready(function() {
	 	$('[data-toggle="popover"]').popover();
		// $('[data-toggle="modal"]').modal();
	})
	
	

};

rhit.main();
