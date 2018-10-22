$("#custom-step").on("click change paste keyup", function() {
  let value = $(this).val();
  if (value.length >= 7) {
    value = value.substr(0, 7);
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
  if (data.log.length <= 1) return;
  for (let entry of data.log) {
    let div = $("<div>");
    div.addClass("slide");
    let info = $("<div>");
    let link = $("<a>");
    link.attr(
      "href",
      `/milestones?user=${entry.name}&step=${entry.step ? entry.step : 10000}`
    );
    link.text(`${entry.name}`);
    link.addClass("slide_name");
    info.append(link);
    let img = $("<img>");
    img.attr(
      "src",
      entry.image
        ? entry.image
        : "https://lastfm-img2.akamaized.net/i/u/300x/818148bf682d429dc215c1705eb27b98"
    );
    img.addClass("slide-image");
    img.attr("data-type", "user");
    let steps = $("<div>");
    steps.addClass("additional-info");
    steps.text(`Step: ${entry.step ? entry.step : 10000}`);
    info.append(steps);
    info.addClass("center-text");
    div.append(img);
    div.append(info);
    $(".slidesContainer").append(div);
  }
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
          slidesToShow: data.log.length <= 5 ? data.log.length - 1 : 5
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: data.log.length <= 3 ? data.log.length - 1 : 3
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
});
