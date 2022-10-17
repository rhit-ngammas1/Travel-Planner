
/** namespace. */
var rhit = rhit || {};
const db = firebase.firestore();

/** globals */
rhit.variableName = "";
rhit.cityManager = null;
rhit.FB_COL_CITY = 'cities';

rhit.PageController = class {

	constructor() {
		this.cityManager = new rhit.CityManager();
		this.cityManager.beginListening(this.updateListener.bind(this));
		this.initializePopover();
		this.initializeModal();
	}

	initializePopover = () => {
		$('#newYorkPin').on('shown.bs.popover', (event) => {
			const target_po = event.target.getAttribute('aria-describedby');
			const target_city = event.target.dataset.cityId;
			console.log(target_city);
			const btn_grp = `
			  <div class="container justify-content-center">
				<div class='city-btn'><button class="btn btn-primary btn-sm" style="margin: 4px 0px 2px 0px; width: 100%" data-bs-toggle="modal" data-bs-target="#cityDetailModal" onclick="rhit.pageController.fetchCityInfo(${target_city})">Detail</button></div>
				<div class='city-btn'><button class="btn btn-success btn-sm" style="margin: 2px 0px 2px 0px; width: 100%">Destination</button></div>
				<div class='city-btn'><button class="btn btn-danger btn-sm" style="margin: 2px 0px 4px 0px; width: 100%">Start Route</button></div>
			  </div>  
			`
			$(`#${target_po}`).attr('data-city-id', '100');
			$(`#${target_po}`).append(btn_grp);
		  })
	}

	initializeModal = () => {
		$('#cityDetailModal').on('show.bs.modal', (event) => {
			$('[data-toggle="popover"]').popover('hide');
		  })
	}

	fetchCityInfo = (cityId) => {
		//$('#cityDetailModal .modal-title').html(cityId);
		this.cityManager.getCity(cityId).then(result => this.prepareCityDetailModal(result)); 
	}

	prepareCityDetailModal(cityInfo) {
		$('#cityDetailModal .modal-title').html(cityInfo.name);
		console.log(cityInfo.info);
		const newInfo = cityInfo.info.replaceAll('\\n', '\n');
		//console.log(newInfo);
		$('#cityDetailModal .modal-body').html(newInfo);
		$('#cityDetailModal .modal-body').attr('style', 'white-space: pre-line')
		
	}

	
	updateListener = () => {
		console.log('there is an update!');
	}

}


rhit.CityManager = class {

	constructor() {
		this.cityCollection = db.collection(rhit.FB_COL_CITY);
		this._unsubcribe = null;
		this.cityList = [];
	}

	beginListening(updateListener) {
		this._unsubcribe = this.cityCollection
		.limit(50)
		.onSnapshot((querySnapshot) => {
			this.cityList = querySnapshot.docs;
			updateListener();
		})
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

rhit.city = class {
	constructor(id, name, imgSrc, info) {
		this.id = id;
		this.name = name;
		this.imgSrc = imgSrc;
		this.info = info;
	}
}



/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");

	rhit.pageController = new rhit.PageController();
	
	$(document).ready(function() {
	 	$('[data-toggle="popover"]').popover();
		$('[data-toggle="modal"]').modal();
	})
	
	

};

rhit.main();
