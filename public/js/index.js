$("#custom-step").on("click change paste keyup", function() {
  let value = $(this).val();
  if (value.length >= 6) {
    value = value.substr(0, 6);
  }
  $("#custom").val(value);
  $(this).val(value);
  $("#custom").click();
});

$("#custom").change(() => {
  $("#custom-step").prop("required", true);
});

$("input[type='radio']")
  .not("#custom")
  .change(() => {
    $("#custom-step").prop("required", false);
  });

$.get("/api/recentRequests", data => {
  if (data.length <= 1) return;
  let slides = [];
  data.sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  for (let i = 0; i < data.length; i++) {
    let entry = data[i];
    let user = entry.user;
    $.get(`/api/getImage/${user}`, resp => {
      resp = JSON.parse(resp);
      let div = $("<div>");
      div.addClass("slide");
      let info = $("<div>");
      let link = $("<a>");
      link.attr(
        "href",
        `/milestones?user=${user}&step=${entry.step ? entry.step : 10000}`
      );
      link.text(`${user}`);
      link.addClass("slide_name");
      info.append(link);
      let img = $("<img>");
      img.attr(
        "src",
        resp.user.image[1]["#text"]
          ? resp.user.image[1]["#text"]
          : "https://lastfm-img2.akamaized.net/i/u/300x/818148bf682d429dc215c1705eb27b98"
      );
      img.addClass("slide-image");
      let steps = $("<div>");
      steps.addClass("additional-info");
      steps.text(`Step: ${entry.step ? entry.step : 10000}`);
      info.append(steps);
      info.addClass("center-text");
      div.append(img);
      div.append(info);
      slides.push(div);
      if (slides.length === data.length) {
        for (let slide of slides) $(".slidesContainer").append(slide);
        $(".recentRequests").slideDown(500);
        $(".slidesContainer").slick({
          slidesToScroll: 1,
          draggable: false,
          autoplay: true,
          mobileFirst: true,
          autoplaySpeed: 2000,
          responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: slides.length <= 5 ? slides.length - 1 : 5
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: slides.length <= 3 ? slides.length - 1 : 3
              }
            },
            {
              breakpoint: 300,
              settings: {
                slidesToShow: 1
              }
            }
          ]
        });
      }
    });
  }
});
