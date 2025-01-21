const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');
const shopNowBtn = document.querySelector(".shopNow");
const element = document.getElementById("001");
const navBar = document.querySelector(".navbar");
const navHeight = navBar.getBoundingClientRect().height;



function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

const smoothScroll = (e) => {
    e.preventDefault();

    let position = element.offsetTop - navHeight;

    window.scrollTo({
      left: 0,
      top: position,
    });
  };

  if(shopNowBtn) {
    shopNowBtn.addEventListener("click", event => {
      smoothScroll(event)
    });
  }
