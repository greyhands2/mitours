//todo sudo npm install parcel-bundler --save-dev

export const hideAlert = () => {
    const el = document.querySelector('.alert');
    if(el) el.parentElement.removeChild(el);
}


// type is success or error
export const showAlert = (type, message) => {
    hideAlert();
   const markUp = `<div class="alert alert--${type}">${message}</div>`;
   document.querySelector('body').insertAdjacentHTML('afterbegin', markUp); 
   window.setTimeout(hideAlert, 5000);
}