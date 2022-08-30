const store = Immutable.Map({
    page: 'index',
    apod: {},
    rovers: Immutable.List(['Curiosity', 'Opportunity', 'Spirit']),
    manifests: Immutable.List([]),
    rover: '',
    photos: [],
    hasEarlierImages: true,
    hasLaterImages: false,
    nextSkip: 0,
    prevSkip: 0,
    header: Immutable.Map({
        sol: 0,
        hasEarlierSol: false,
        hasLaterSol: true
    })
});

// add our markup to the page
const root = document.getElementById('root');

const updateStore = (state, newState) => {
    let newStore = state.merge(newState);
    render(root, newStore);
};


const render = async (root, state) => {
    root.innerHTML = App(state)
};


// create content

/**
 * Used to activate/deactivate sol selection buttons in the header. 
 * If param is false returns classname for making button inactive
 * @param {bool} param 
 * @returns {string} Class name for the button
 */
const buttonDisabled = (param) => {
    return param ? '' : 'button--disabled';
};

/**
 * Generates HTML for sol selector 
 * @param {*} state Application state object
 * @returns {string} HTML
 */
const Sol = state => {
    const header = state.get('header');
    const rover = state.get('rover');
    const hasEarlierSol = header.get('hasEarlierSol');
    const hasLaterSol = header.get('hasLaterSol');
    const prevHref = hasEarlierSol ? `/${rover}/${parseInt(header.get('sol')) - 1}` : '';
    const nextHref = hasLaterSol ? `/${rover}/${parseInt(header.get('sol')) + 1}` : '';
    return `<div class="sol">
<a href="${prevHref}" class="button sol__button sol__prev ${buttonDisabled(hasEarlierSol)}"></a>
<span class="sol__number">${header.get('sol')}</span>
<a href="${nextHref}" class="button sol__button sol__next ${buttonDisabled(hasLaterSol)}"></a>
</div>`;
};

/**
 * Returns a function for generanting header HTML depending upon type of page
 * @param {string} page One of 'index' or 'rover'. Can be expanded.
 * @returns {function}
 */
const headerForPage = page => {
    switch (page) {
        case 'index':
            return () => {
                return `<header class="header header--page-${page}">
                    <div class="logo header__logo"></div>
                </header>`;
            };
        case 'rover':
            return state => {
                return `<header class="header header--page-${page} header--rover-${state.get('rover')}">
                <a href="/index" class="button button--type-back"></a>
                ${Sol(state)}
            </header>`;
            };
        case 'apod':
            return () => {
                return `<header class="header header--page-${page}">
                <a href="/index" class="button button--type-back"></a>
                <span class="apod__logo">Astronomy Picture<br>Of The Day</span>
                </header>`;
            };
        default:
            return;
    }
};
/**
 * Used for formatting date and month output
 * @param {number} number 
 * @returns {string} The input number padded with 0 if needed
 */
const addLeadingZero = number => {
    if (number < 10) {
        return `0${number}`;
    }
    return `${number}`;
};

/**
 * Generates HTML for index page content area
 * @param {*} state Application state object
 * @returns {string} HTML
 */
const Rovers = state => {
    let manifests = state.get('manifests');

    if (manifests.isEmpty()) {
        getRoverManifests(store);
    }
    return manifests.map(rover => {
        const roverData = rover.toObject();
        const name = roverData.name.toLowerCase();
        const launch_date = new Date(roverData.launch_date);
        const landing_date = new Date(roverData.landing_date);
        return ` <li class="rovers__item rovers--rover-${name}">
        <div class="rovers__inner">
            <div class="rovers__data">
                <div class="rovers__header">
                    <h2 class="rovers__title">${roverData.name}</h2>
                    <button class="button button--type-showinfo"></button>
                </div>
                <ul class="rovers__info info">
                    <li class="info__item">
                        <span class="info__launched"><span class="info__year">${launch_date.getFullYear()}</span><span
                                class="info__monthday">
                                <span class="info__month">${addLeadingZero(launch_date.getMonth() + 1)}</span><span class="info__day">${addLeadingZero(launch_date.getDate())}</span>
                            </span></span>
                    </li>
                    <li class="info__item">
                        <span class="info__landed"><span class="info__year">${landing_date.getFullYear()}</span><span
                                class="info__monthday">
                                <span class="info__month">${addLeadingZero(landing_date.getMonth() + 1)}</span><span class="info__day">${addLeadingZero(landing_date.getDate())}</span>
                            </span></span>
                    </li>
                    <li class="info__item">
                        <span class="info__status">${roverData.status}</span>
                    </li>
                </ul>
            </div>
            <a href="/${name}/${roverData.max_sol}" class="rovers__preview"></a>
        </li>`
    });
};

/**
 * Generates HTML for rover page image gallery
 * @param {*} state Application state object
 * @returns {string} HTML
 */
const Thumbnails = state => {
    if (state.get('photos').size === 0) {
        return Immutable.List([`<li class="thumbnails__item thumbnails--load-earlier">
        <div class="thumbnails__inner">No photos on this sol. Choose another sol.</div>
    </li>`]);
    }
    const earlier = state.get('hasEarlierImages') ? Immutable.List([`<li class="thumbnails__item thumbnails--load-earlier">
    <a href="/${state.get('rover')}/${state.getIn(['header', 'sol'])}/${state.get('nextSkip')}" class="thumbnails__inner">Load Earlier Images</a>
</li>`]) : Immutable.List([]);
    const later = state.get('hasLaterImages') ? Immutable.List([`<li class="thumbnails__item thumbnails--load-earlier">
<a href="/${state.get('rover')}/${state.getIn(['header', 'sol'])}/${state.get('prevSkip')}" class="thumbnails__inner">Load Later Images</a>
</li>`]) : Immutable.List([]);
    return later.concat(state.get('photos').map(photo => {
        return `<li class="thumbnails__item">
        <div class="thumbnails__inner">
            <ul class="thumbnails__info info">
                <li class="info__item"><span class="info__id">${photo.get('id')}</span></li>
                <li class="info__item"><span class="info__cam">${photo.getIn(['camera', 'name'])}</span></li>
                <li class="info__item"><span class="info__sol">${photo.get('sol')}</span></li>
            </ul>
            <div class="thumbnails__frame"><img class="thumbnail" src="${photo.get('img_src')}"
                    alt="Image ${photo.get('id')}" data-id="${photo.get('id')}" data-earth-date="${photo.get('earth_date')}"
                    data-cameraName="${photo.getIn(['camera', 'full_name'])}">
            </div>
        </div>
    </li>`;
    }), earlier);
};

/**
 * Returns a function for generanting content area HTML depending upon type of page
 * @param {string} page One of 'index' or 'rover'. Can be expanded.
 * @returns {function}
 */
const contentForPage = page => {
    switch (page) {
        case 'index':
            return state => {
                return `<main class="content content--page-${page}">
                <ul class="content__inner rovers">
                    ${Rovers(state).join('')}
                </ul>
                </main>`;
            };
        case 'rover':
            return state => {
                return `<main class="content content--page-${page}">
                    <ul class="content__inner thumbnails">
                    ${Thumbnails(state).join('')}
                    </ul>
                </main>`;
            };
        case 'apod':
            return state => {
                return `<main class="content content--page-${page}"></main>`;
            }
        default:
            return;
    }
};

/**
 * Returns a function for generanting footer HTML depending upon type of page
 * @param {string} page One of 'index' or 'rover'. Can be expanded.
 * @returns {function}
 */
const footerForPage = page => {
    // footer could be generated statically
    // function is used for consistency 
    switch (page) {
        case 'index':
            return state => {
                return `<footer class="footer footer--page-index">
                <span class="apod__logo">Astronomy Picture<br>Of The Day</span>
                <a href="/apod" class="footer__button"></a>
                </footer>`;
            };
        case 'rover':
            return state => {
                return `<footer class="footer"></footer>`;
            };
        case 'apod':
            return state => {
                return `<footer class="footer footer--page-apod">
                <button class="button apod__show_info"></button>
                </footer>`;
            };
        default:
            return;
    }
};

/**
 * Returns a function for generanting full screen image HTML depending upon type of page
 * @param {string} page One of 'index' or 'rover'. Can be expanded.
 * @returns {function}
 */
const bigImageForPage = page => {
    switch (page) {
        case 'index':
            // no full screen image on index page so
            // return a function that returns an empty string
            return state => {
                return '';
            };
        case 'rover':
            // state is not used here
            // using function for consistency
            return state => {
                return `<div id="bigimage" class="bigimage bigimage--rover">
                <div class="bigimage__frame">
                    <button class="bigimage__close button button--type-close"></button>
                    <div class="bigimage__turn turn"></div>
                </div>
                <ul class="bigimage__info info--image">
                    <li class="info__item"><span class="info__id"></span></li>
                    <li class="info__item"><span class="info__cam"></span></li>
                    <li class="info__item"><span class="info__date"></span></li>
                </ul>
            </div>`;
            };
        case 'apod':
            return state => {
                if (state.getIn(['apod', 'media_type']) === "video") {
                    return `<div class="apod bigimage bigimage--open">
                    <div class="bigimage__frame bigimage--visible">
                    </div>
                    <ul class="bigimage__info info--apod">
                        <li class="info__item"><p>See today's featured video <a href="${state.getIn(['apod', 'url'])}">here</a></p></li>
                        <li class="info__item"><p>${state.getIn(['apod', 'title'])}</p></li>
                        <li class="info__item"><p>${state.getIn(['apod', 'explanation'])}</p></li>
                    </ul>
                </div>`;
                } else {
                    return `<div class="apod bigimage bigimage--open bigimage--horizontal">
                    <div class="bigimage__frame bigimage--visible bigimage--full" style="background-image: url(${state.getIn(['apod', 'url'])})">
                        <div class="bigimage__turn turn"></div>
                    </div>
                    <ul class="bigimage__info info--apod apod--hidden">
                        <button class="button button--type-closeinfo apod__hide_info"></button>
                        <li class="apod__item apod--item-title"><span class="info__title">${state.getIn(['apod', 'title'])}</span></li>
                        <li class="apod__item apod--item-copy"><span class="info__copy"></span>${state.hasIn(['apod', 'copyright']) ? state.getIn(['apod', 'copyright']) : 'N/A'}</li>
                        <li class="apod__item apod--item-date"><span class="info__date"></span>${state.getIn(['apod', 'date'])}</li>
                        <li class="apod__item"><span class="info__expl"></span>${state.getIn(['apod', 'explanation'])}</li>
                    </ul>
                </div>`;
                }
            }
        default:
            return;
    }
};

// 'main' function
const App = (state) => {
    const page = state.get('page');
    const Header = headerForPage(page);
    const Content = contentForPage(page);
    const Footer = footerForPage(page);
    const BigImage = bigImageForPage(page);
    return `
        ${Header(state)}
        ${Content(state)}
        ${Footer(state)}
        ${BigImage(state)}
    `
};

/**
 * Photo thumbnail click handler for rover page
 * @param {HTMLImgElement} image The clicked thumbnail
 */
const showBigImage = (image) => {
    const destination = document.getElementById('bigimage');
    if (!destination) {
        return;
    }
    const [frame, info] = destination.children;
    destination.classList.add('bigimage--open');
    if (image.naturalWidth > destination.clientWidth || image.naturalHeight > destination.clientHeight) {
        frame.classList.add('bigimage--full');
    } else {
        frame.classList.remove('bigimage--full');
    }
    if ((image.naturalWidth / image.naturalHeight) > 4 / 3) {
        destination.classList.add('bigimage--horizontal');
    } else {
        destination.classList.remove('bigimage--horizontal');
    }
    frame.style.backgroundImage = `url(${image.src})`;
    info.querySelector('.info__id').textContent = image.dataset.id;
    info.querySelector('.info__cam').textContent = image.dataset.cameraname;
    info.querySelector('.info__date').textContent = image.dataset.earthDate;
    frame.classList.add('bigimage--visible');
};

/**
 * Full screen image close button click handler
 * @param {HTMLButtonElement} button The clicked button
 */
const closeBigImage = button => {
    const frame = button.parentNode;
    frame.classList.remove('bigimage--visible');
    frame.style = '';
    // reset infos
    Array.from(frame.nextElementSibling.children).forEach(li => {
        li.children[0].textContent = '';
    });
    frame.closest('#bigimage').classList.remove('bigimage--open');
};

const showAPODInfo = button => {
    document.querySelector('.info--apod').classList.remove('apod--hidden');
}
const hideAPODInfo = button => {
    document.querySelector('.info--apod').classList.add('apod--hidden');
}

/**
 * Major click handler. Calls other functions depending on click target
 * @param {event} event Click event
 */
const clickHandler = (event) => {
    event.preventDefault(); // you can check out anytime you like but you can never leave
    const target = event.target;
    const targetNodeName = target.nodeName;
    switch (targetNodeName) {
        case 'A':
            fetchPage(store, target.getAttribute('href'));
            break;

        case 'IMG':
            if (target.className === 'thumbnail') {
                showBigImage(target);
            }
            break;
        case 'BUTTON':
            if (target.classList.contains('bigimage__close')) {
                closeBigImage(target);
            } else if (target.classList.contains('apod__show_info')) {
                // show apod info
                showAPODInfo(target);
            } else if (target.classList.contains('apod__hide_info')) {
                // hide apod info
                hideAPODInfo(target);
            }
            break;
        default:
            return;
    }
}
document.addEventListener('click', clickHandler);
// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
    render(root, store);
});

// ------------------------------------------------------  API CALLS
const fetchPage = (state, path) => {
    fetch(`${window.location.origin}/.netlify/functions/index${path}`)
        .then(res => res.json())
        .then(data => updateStore(state, data));
};

const getRoverManifests = state => {
    fetchPage(state, '/index');
};

// ------------------------------------------------------  UTILS

//reset info button helper
const resetButton = button => {
    button.classList.remove('button--type-closeinfo');
    button.classList.add('button--type-showinfo');
};

// reset preview helper
const resetPreview = preview => {
    preview.classList.remove('rovers--hidden');
};

// reveals rover info on smartphone landscape orientation
const showInfo = event => {
    if (event.target.nodeName !== 'BUTTON') {
        return;
    }
    const button = event.target;
    if (button.parentNode.className !== 'rovers__header') {
        return;
    }
    const container = button.closest('.rovers__inner');
    const preview = container.querySelector('.rovers__preview');
    if (button.classList.contains('button--type-showinfo')) {
        button.classList.remove('button--type-showinfo');
        button.classList.add('button--type-closeinfo');
        preview.classList.add('rovers--hidden');
    } else if (button.classList.contains('button--type-closeinfo')) {
        resetButton(button);
        resetPreview(preview);
    }
};
// this is only relevant on smartphone landscape orientation
document.addEventListener('click', showInfo);

// upon changing device orientation brings back rover preview if it was hidden by info
window.addEventListener('orientationchange', () => {
    if (Math.abs(window.orientation) === 90) {
        return;
    }
    document.querySelectorAll('.rovers__inner').forEach(elememt => {
        resetPreview(elememt.querySelector('.rovers__preview'));
        resetButton(elememt.querySelector('button'));
    });
});