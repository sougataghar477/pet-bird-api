const noImageAlert = document.querySelector(".no-image-alert");
const otherBreed = document.querySelector(".other-breed");
const loader = document.querySelector(".loader");
const notificationSuccess = document.querySelector(".notification-success");
const notificationFailure = document.querySelector(".notification-failure");
const themeSelector = document.querySelector(".theme-selector");
const isThemePresent = localStorage.getItem("theme");
let isDark = document.documentElement.dataset.theme==="dark";
if(isThemePresent){
   document.documentElement.setAttribute("data-theme",isThemePresent)
   themeSelector.textContent=isDark?'🔆':'🌙';
}
const toggleTheme = (event) => {
let isDark = document.documentElement.dataset.theme==="dark";
console.log(isDark);
if(!isThemePresent){
    localStorage.setItem("theme",document.documentElement.dataset.theme)
}
else{
    localStorage.setItem("theme",isDark?"light":"dark"); 
}
  document.documentElement.setAttribute("data-theme", isDark?"light":"dark");
  event.target.textContent=isDark?'🌙':'🔆';
};

function detectOtherBreed(event){
    if(event.target.value==="other"){
        console.log("detected");
        otherBreed.classList.remove("hidden");
        otherBreed.required = true;
    }
    else{
        otherBreed.required = false;
        otherBreed.classList.add("hidden");
    }
}
function fetchNewBirdImage(event){
    event.preventDefault();
    let imageElement = event.target.parentElement.nextElementSibling.querySelector("img");
    let birdValue = new FormData(event.target).get("birdValue");
    loader.classList.remove("hidden");
    fetch("/showNewImage", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
         breed:birdValue
    })
    })
    .then(r => r.json())
    .then(d => {
        loader.classList.add("hidden");
        if(!d.image.includes(" ")){
            imageElement.src = d.image
        }
        else{
            noImageAlert.classList.remove("hidden");
            setTimeout(() => {
                noImageAlert.classList.add("hidden");
            }, 3000);
        }
    })

}
function uploadImage(event) {
  event.preventDefault();
  let submitter = event.submitter;
  submitter.textContent = "Uploading...";
  submitter.disabled = true;
  const formData = new FormData(event.target);
  fetch("/uploadNewImage", {
    method: "POST",
    body: formData, 
  })
    .then(r => r.json())
    .then(d => {
        console.log(d);
        if(d?.image && !d?.image.includes(" ")){
            submitter.textContent = "Upload";
            submitter.disabled = false;
            notificationSuccess.classList.remove("hidden");
            setTimeout(()=>{
                notificationSuccess.classList.add("hidden")
            },3000)
        }
        if(d?.message?.message==="The resource already exists"){
            submitter.disabled = false;
            submitter.textContent = "Upload";
            notificationFailure.querySelector("span").textContent = d?.message?.message;
            notificationFailure.classList.remove("hidden");
            setTimeout(() => {
                notificationFailure.classList.add("hidden");
            }, 3000);
        }
    })
    .catch(err => {
        console.error(err);
    })

    ;
}
