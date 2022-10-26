
/** namespace. */
var rhit = rhit || {};
const db = firebase.firestore();

/** globals */
rhit.variableName = "";
rhit.pageController = null;
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
rhit.fbAuthManager = null;
rhit.FB_KEY_AUTHOR = "author";
rhit.cityManager = null;
rhit.planManager = null;
rhit.routeManager = null;

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

rhit.PlanManager = class {
	constructor(uid) {
		this._uid=uid;
		this.planCollection=firebase.firestore().collection(rhit.FB_COLLECTION_PLAN);
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
			this.cityList = docSnapshot.docs;
			console.log(docSnapshot.docs);
			updateListener();
		})
	}

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

// rhit.ListPageController = class{
// 	constructor(){
// 		// document.querySelector("#submitAddPhoto").onclick = (event) => {
			
// 		// }

// 		document.querySelector("#submitAddPhoto").addEventListener("click",(event) => {
// 			const url=document.querySelector("#inputUrl").value;
// 			const caption=document.querySelector("#inputCaption").value;
// 			rhit.fbPhotoBucketManager.add(url,caption);
// 		})
// 		$('#addPhotoDialog').on('show.bs.modal', (event) => {
// 			// Pre animation
// 			document.querySelector("#inputUrl").value = "";
// 			document.querySelector("#inputCaption").value= "";
// 		})
// 		$('#addPhotoDialog').on('shown.bs.modal', (event) => {
// 			// Post animation
// 			document.querySelector("#inputUrl").focus();
// 		})
		
// 		//Start listening
// 		rhit.fbPhotoBucketManager.beginListening(this.updateList.bind(this))
// 	}

// 	_createCard(plan){
// 		return htmlToElement(`        <div>
// 		<img src='' class='iconDetails'>
// 	</div>
// 	<div style='margin-left:60px;'>
// 		<h4 class="title">${plan.title}</h4>
// 		<div class="startDate" style="font-size:.6em">${plan.startDate}</div>
// 		<div class="description" style="font-size:.6em">${plan.description}</div>
// 	</div>`)
// 	}

// 	updateList() {
// 		const newList= htmlToElement('<div id="columns"></div>');
// 		for(let i=0;i<rhit.fbPhotoBucketManager.length;i++){
// 			const pb=rhit.fbPhotoBucketManager.getPhotoAtIndex(i);
// 			const newCard = this._createCard(pb);
// 			newCard.onclick = (event) => {

// 				// rhit.storage.setPhotoId(pb.id);
// 				window.location.href=`/photo.html?id=${pb.id}`
// 			} 
// 			newList.appendChild(newCard);
// 		}


// 		const oldList=document.querySelector("#columns");
// 		oldList.removeAttribute("id");
// 		oldList.hidden=true;

// 		oldList.parentElement.appendChild(newList);
// 	}
// }
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
		window.location.href="/"
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
