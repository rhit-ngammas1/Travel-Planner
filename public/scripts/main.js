
/** namespace. */
var rhit = rhit || {};
const db = firebase.firestore();

/** globals */
rhit.variableName = "";
rhit.pageController = null;
rhit.FB_COL_CITY = 'cities';

rhit.PageController = class {

	constructor() {
		this.cityManager = new rhit.CityManager();
		this.cityManager.beginListening(this.updateListener.bind(this));
		this.initializePopover();
		this.initializeModal();
	}

	initializePopover = () => {
		$('[data-toggle="popover"]').on('shown.bs.popover', (event) => {
			const target_po = event.target.getAttribute('aria-describedby');
			const target_city_id = event.target.dataset.pinCityId;
			const target_city_name = event.target.dataset.pinCityName;
			const btn_grp = `
			  <div class="container justify-content-center">
				<div class='city-btn'><button class="btn btn-primary btn-sm city-detail-btn" style="margin: 4px 0px 2px 0px; width: 100%" data-bs-toggle="modal" data-bs-target="#cityDetailModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Detail</button></div>
				<div class='city-btn'><button class="btn btn-success btn-sm add-dest-btn" style="margin: 2px 0px 2px 0px; width: 100%" data-bs-toggle="modal" data-bs-target="#addDestModal" data-city-id="${target_city_id}" data-city-name="${target_city_name}">Destination</button></div>
				<div class='city-btn'><button class="btn btn-danger btn-sm" style="margin: 2px 0px 4px 0px; width: 100%">Start Route</button></div>
			  </div>  
			`
			
			$(`#${target_po}`).append(btn_grp);

			$('.city-detail-btn').on('click', (event) => {
				this.fetchCityInfo(event.target.dataset.cityId);
			})

			$('.add-dest-btn').on('click', (event) => {
				this.prepareAddDestModal(event.target.dataset.cityName);
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

	prepareAddDestModal = (cityName) => {
		$('#addDestModal .add-dest-title').html('Adding a travel plan to ' + cityName);
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
		// $('[data-toggle="modal"]').modal();
	})
	
	

};

rhit.main();
