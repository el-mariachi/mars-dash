console.log('static');
document.addEventListener('click', event => {
    event.preventDefault();
    // console.log(event);
    const target = event.target;
    const targetNodeName = target.nodeName;
    switch (targetNodeName) {
        case 'A':
            console.log(target.getAttribute('href'));
            break;

        case 'IMG':
            console.log(target.getAttribute('src'));
            break;

        default:
            return;
    }
});