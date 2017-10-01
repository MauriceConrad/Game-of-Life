function Dialog(e) {
  this.dialogElement = e;

  var closeBtns = this.dialogElement.getElementsByClassName("btn-close-dialog");

  var closeBtn;
  for (closeBtn of closeBtns) {
    closeBtn.addEventListener("click", event => {
      this.close();
    });
  }
}
Dialog.prototype.close = function() {
  document.body.classList.remove("dialog-shown");
  document.querySelector(".main").disabled = false;

  this.dialogElement.classList.remove("active");
}
Dialog.prototype.open = function(e) {
  document.body.classList.add("dialog-shown");
  document.querySelector(".main").disabled = true;

  this.dialogElement.classList.add("active");
}
