const store = Immutable.Map({
    page: 'index',
    apod: '',
    rovers: Immutable.List(['Curiosity', 'Opportunity', 'Spirit']),
    manifests: Immutable.List([]),
    rover: '',
    images: [],
    hasEarlierImages: true,
    hasLaterImages: false,
    header: Immutable.Map({
        sol: 3008,
        hasEarlierSol: true,
        hasLaterSol: false
    })
});

// add our markup to the page
const root = document.getElementById('root');

const updateStore = (state, newState) => {
    let newStore = state.merge(newState);
    render(root, newStore);
};


// render is not a pure function
const render = async (root, state) => {
    root.innerHTML = App(state)
};


// create content

/**
 * If param is false returns classname for making button inactive
 * @param {bool} param 
 * @returns {string} 
 */
const buttonDisabled = (param) => {
    return param ? '' : 'button--disabled';
};


const Sol = state => {
    const header = state.get('header');
    const rover = state.get('rover');
    const hasEarlierSol = header.get('hasEarlierSol');
    const hasLaterSol = header.get('hasLaterSol');
    const prevHref = hasEarlierSol ? `/${rover}?sol=${parseInt(header.get('sol')) - 1}` : '';
    const nextHref = hasLaterSol ? `/${rover}?sol=${parseInt(header.get('sol')) + 1}` : '';
    return `<div class="sol">
<a href="${prevHref}" class="button sol__button sol__prev ${buttonDisabled(hasEarlierSol)}"></a>
<span class="sol__number">${header.get('sol')}</span>
<a href="${nextHref}" class="button sol__button sol__next ${buttonDisabled(hasLaterSol)}"></a>
</div>`;
};

const headerForPage = page => {
    switch (page) {
        case 'index':
            return () => {
                return `<header class="header header--page-index">
                    <div class="logo header__logo"></div>
                </header>`;
            };
            break;
        case 'rover':
            return state => {
                return `<header class="header header--page-rover header--rover-${state.get('rover')}">
                <a href="/index" class="button button--type-back"></a>
                ${Sol(state)}
            </header>`;
            };
            break;
        default:
            break;
    }
};

const addLeadingZero = number => {
    if (number < 10) {
        return `0${number}`;
    }
    return `${number}`;
};

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
            <a href="/${name}" class="rovers__preview"></a>
        </li>`
    });
};

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
            break;
        case 'rover':
            return state => { };
            break;
        default:
            break;
    }
};

const footerForPage = page => {
    switch (page) {
        case 'index':
            return state => {
                // return `<footer class="footer footer--page-index"><span class="apod__logo">Astronomy Picture<br>Of The Day</span></footer>`;
                return `<footer class="footer"></footer>`;
            };
            break;
        case 'rover':
            return state => {
                return `<footer class="footer"></footer>`;
            };
            break;

        default:
            break;
    }
};


const App = (state) => {
    const page = state.get('page');
    console.log(page);
    const Header = headerForPage(page);
    const Content = contentForPage(page);
    const Footer = footerForPage(page);
    return `
        ${Header(state)}
        ${Content(state)}
        ${Footer(state)}
    `
};

const clickHandler = (event) => {
    event.preventDefault();
    const target = event.target;
    const targetNodeName = target.nodeName;
    switch (targetNodeName) {
        case 'A':
            fetchPage(store, target.getAttribute('href'));
            break;

        case 'IMG':
            console.log(target.getAttribute('src'));
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

// ------------------------------------------------------  COMPONENTS

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = (apod) => {
    // If image does not already exist, or it is not from today -- request it again
    const today = new Date();
    const photodate = new Date(apod.date);
    console.log(photodate.getDate(), today.getDate());

    console.log(photodate.getDate() === today.getDate());
    if (!apod || apod.date === today.getDate()) {
        getImageOfTheDay(store)
    }

    // check if the photo of the day is actually type video!
    if (apod.media_type === "video") {
        return (`
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `)
    } else {
        return (`
            <img src="${apod.image.url}" height="350px" width="100%" />
            <p>${apod.image.explanation}</p>
        `)
    }
}

// ------------------------------------------------------  API CALLS

// Example API call
const getImageOfTheDay = (state) => {
    let { apod } = state

    fetch(`http://localhost:3000/apod`)
        .then(res => res.json())
        .then(apod => updateStore(store, { apod }))

    // return data
}

const fetchPage = (state, path) => {
    fetch(`http://localhost:3000${path}`)
        .then(res => {
            window.history.pushState("", "", res.headers.get('Location'));
            return res.json();
        }).then(data => updateStore(state, data));
};

const getRoverManifests = state => {
    fetchPage(state, '/index');
};

//reset info button
const resetButton = button => {
    button.classList.remove('button--type-closeinfo');
    button.classList.add('button--type-showinfo');
};

// reset preview
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