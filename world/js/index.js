import '@babel/polyfill';
import {login, logout} from './login';
import {updateSettings} from './updateSettings';
import {bookTour} from './stripe';
import {displayMap} from './mapbox';
// todo npm install @babel/polyfill

//DOM ELEMENTS
const mapboxDOM = document.getElementById('map');
const loginFormDOM = document.querySelector('.form--login');

const userDataFormDOM = document.querySelector('.form-user-data');

const userPasswordFormDOM = document.querySelector('.form-user-password');

const logoutButtonDOM = document.querySelector('.nav__el--logout');

const updatePasswordButtonDOM = document.querySelector('.btn--save-password');

const bookBtnDom = document.getElementById('book-tour');

//delegation
if(mapboxDOM){
const locations = JSON.parse(mapboxDOM.dataset.locations);
displayMap(locations);
}

if(loginFormDOM){
    loginFormDOM.addEventListener('submit', e => {
    e.preventDefault();
   //values
const email = document.getElementById('email').value;
const password = document.getElementById('password').value;

    login(email, password);
});
}

if(logoutButtonDOM){
    logoutButtonDOM.addEventListener('click', ()=> {
        logout();

    })
}

if(userDataFormDOM){
    userDataFormDOM.addEventListener('submit', (e)=> {
        e.preventDefault();
        const form = new FormData();


        const email = document.getElementById('email').value;

        const name = document.getElementById('name').value;

        form.append('name', name);
        form.append('email', email);
        form.append('photo', document.getElementById('photo').files[0]);

        updateSettings(form, 'data');
    })
}



if(userPasswordFormDOM){
    userPasswordFormDOM.addEventListener('submit', async (e)=> {
        e.preventDefault();
        updatePasswordButtonDOM.textContent='Updating...';
        const passwordCurrent = document.getElementById('password-current').value;

        const password = document.getElementById('password').value;

        const passwordConfirm = document.getElementById('password-confirm').value;

         await updateSettings({passwordCurrent, password, passwordConfirm}, 'password');

         updatePasswordButtonDOM.textContent='Save Password';
         document.getElementById('password-current').value='';
         document.getElementById('password').value='';
         document.getElementById('password-confirm').value='';


    })
}


if(bookBtnDom){
  bookBtnDom.addEventListener('click', (e)=> {
    e.target.textContent = 'Processing...';
    const {tourId} = e.target.dataset;
    bookTour(tourId);
  })
}
