const commonSetting = {
  "async": true,
  "crossDomain": true,
  "method": "GET",
  "headers": {
    "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
    "x-rapidapi-key": "291983d532msh0eec23d597e9db4p194141jsn9c04ac451d6e"
  }
};

const dateFormatter = (value) => {
  const date = new Date(value);
  const options = { hour: "numeric", minute: "numeric", year: "numeric", month: "short", day: "numeric" };
  return date.toLocaleString("en-US", options);
};

$(() => {
  let isLoading = false;
  const $regionalInfoBtn = $("#regionalInfo");
  // create a dropdown for countries
  $.ajax({
    ...commonSetting,
    "url": "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/reference/v1.0/countries/en-US"
  }).done((response) => {
    response.Countries.sort((a, b) => a.Name < b.Name ? -1 : 1)
      .forEach((country) => {
        $("#countries").append($("<option>", { label: country.Name }).val(country.Code).text(country.Name));
      });
    // set a default value to the input for the server
    const defaultCountry = response.Countries.find((country) => country.Code == "US");
    $("#country").val(defaultCountry.Code);
    $("#currentCountry").text(defaultCountry.Name);
  });

  // create a dropdown for currencies
  $.ajax({
    ...commonSetting,
    "url": "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/reference/v1.0/currencies"
  }).done(function (response) {
    response.Currencies.sort((a, b) => a.Code < b.Code ? -1 : 1)
      .forEach((currency) => {
        $("#currencies").append($("<option>").text(currency.Code));
      });
    // set a default value to the input for the server
    const defaultCurrency = response.Currencies.find((currency) => currency.Code == "USD");
    $("#currency").val(defaultCurrency.Code);
    $("#currentCurrency").text(defaultCurrency.Code);
  });

  $("#regionalInfoForm").submit((e) => {
    e.preventDefault();
    $("#country").val(e.target.countries.value);
    $("#currency").val(e.target.currencies.value);
    $("#currentCountry").text(e.target.countries.selectedOptions[0].label);
    $("#currentCurrency").text(e.target.currencies.value);
    $overlay.css({ display: "none" });
    $modal.css({ display: "none" });
  });

  $("#departureDate").datepicker();
  $("#returnDate").datepicker();

  $("#from, #to").autocomplete({
    source: (req, res) => {
      $.ajax({
        ...commonSetting,
        "data": `query=${req.term}`,
        "url": "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/autosuggest/v1.0/US/USD/en-US/"
      }).done((data) => res(
        data.Places
          .filter((place) => place.PlaceId != place.CountryId)
          .map(
            (place) => {
              const placeId = place.PlaceId.slice(0, -4);
              const cityId = place.CityId.slice(0, -4);
              const modifier = placeId == cityId ? "Any" : placeId;
              return ({
                label: `${place.PlaceName} (${modifier})`,
                value: `${place.PlaceName} (${modifier})`,
                code: place.PlaceId
              })
            }
          )
      ));
    },
    select: (e, ui) => {
      $(e.target).attr({ code: ui.item.code });
    }
  });

  const $overlay = $(".overlay");
  const $modal = $(".modal");
  const $travelersField = $("#travelers");
  const $travelersBalloon = $("#travelers-balloon");

  // place a balloon for travelers
  const posision = $travelersField.offset();
  $travelersBalloon.css({ top: posision.top + 43, left: posision.left });

  $travelersField.on("click", (e) => {
    $travelersBalloon.toggle();
  });

  $regionalInfoBtn.on("click", (e) => {
    $regionalInfoBtn.blur();
    $("#countries").val($("#country").val());
    $("#currencies").val($("#currency").val());
    $overlay.css({ display: "block" });
    $modal.css({ display: "block" });
  });

  $(document).on("click", (e) => {
    if (
      $travelersBalloon.css("display") == "block"
      && !($(e.target).is($travelersField) || $(e.target).closest($travelersBalloon)[0])
    ) {
      $travelersBalloon.css({ display: "none" });
    }
    if (!isLoading && $(e.target).is($overlay)) {
      $overlay.css({ display: "none" });
      $modal.css({ display: "none" });
    }
  });

  $(".close, #cancel").click((e) => {
    $overlay.css({ display: "none" });
    $modal.css({ display: "none" });
  })

  $("#adults, #children, #infants").change((e) => {
    const adults = parseInt($("#adults").val());
    const children = parseInt($("#children").val());
    const infants = parseInt($("#infants").val());
    const total = adults + children + infants;
    let modifier = total > 1 ? "travelers" : "adult";

    // set a value for the display
    $travelersField.val(total + " " + modifier)
    // set values for the server
    $travelersField.attr({ adults, children, infants });
  })

  $(".minus").click(function (e) {
    const $inputField = $(this).next();
    const $plusButton = $(this).next().next();
    const value = parseInt($inputField.val());

    if ((($inputField.attr("id") == "adults") && value == 2) || value == 1) {
      $(this).prop("disabled", true);
    } else {
      $plusButton.prop("disabled", false);
    }
    $inputField.val(value - 1);

    // trigger the change event for the number of each traveler
    $inputField.trigger("change");
  });

  $(".plus").click(function (e) {
    const $inputField = $(this).prev();
    const $minusButton = $(this).prev().prev();
    const value = parseInt($inputField.val());

    if (value == 7) {
      $(this).prop("disabled", true);
    } else {
      $minusButton.prop("disabled", false);
    }
    $inputField.val(value + 1);

    // trigger the change event for the number of each traveler
    $inputField.trigger("change");
  });

  $("#inputForm").submit((e) => {
    e.preventDefault();
    if ($overlay.css("display") == "block") return;
    $("#result").empty();
    const inputItems = e.target.elements;
    const originPlace = inputItems.from.attributes.code.value;
    const destinationPlace = inputItems.to.attributes.code.value;
    const outboundDate = $.datepicker.formatDate("yy-mm-dd", new Date(inputItems.departureDate.value));
    const inboundDate = $.datepicker.formatDate("yy-mm-dd", new Date(inputItems.returnDate.value));
    const cabinClass = inputItems.cabinClass.value;
    const adults = inputItems.travelers.attributes.adults.value;
    const children = inputItems.travelers.attributes.children.value;
    const infants = inputItems.travelers.attributes.infants.value;
    const country = inputItems.country.value;
    const currency = inputItems.currency.value;

    const createSessionSetting = {
      ...commonSetting,
      "url": "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/v1.0",
      "method": "POST",
      "headers": {
        ...commonSetting.headers,
        "content-type": "application/x-www-form-urlencoded"
      },
      "data": {
        inboundDate,
        originPlace,
        destinationPlace,
        outboundDate,
        cabinClass,
        adults,
        children,
        infants,
        country,
        currency,
        "groupPricing": true,
        "locale": "en-US"
      }
    };

    $overlay.css({ display: "block" });
    $("#loading").addClass("loading");
    isLoading = true;

    $.ajax(createSessionSetting).done((response) => {
      console.log("done for Create Session", response);

    }).fail((jqXHR, textStatus, errorThrown) => {
      console.log("fail for Create Session", jqXHR, textStatus, errorThrown);
      $("#loading").removeClass("loading");
      $overlay.css({ display: "none" });

    }).always((data, textStatus, jqXHR) => {
      console.log("always for Create Session", data, textStatus, jqXHR);

      const sessionkey = jqXHR.getResponseHeader("location").slice(-36);
      const pollSessionResultSetting = {
        ...commonSetting,
        "url": `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/uk2/v1.0/${sessionkey}`,
        "data": {
          "sortType": "price",
          "sortOrder": "asc",
          "stops": "1",
          "pageIndex": "0",
          "pageSize": "20"
        }
      };

      pollSessionResult(pollSessionResultSetting);
    });
  });

  const pollSessionResult = (setting) => {
    $.ajax(setting).done((response) => {
      console.log(response.Status);
      if (response.Status != "UpdatesComplete") {
        setTimeout(() => {
          pollSessionResult(setting);
        }, 500);
      } else {
        console.log(response);
        isLoading = false;
        $("#loading").removeClass("loading");
        $overlay.css({ display: "none" });
        displayResult(response);
      }
    }).fail((jqXHR, textStatus, errorThrown) => {
      console.log("fail for Poll Session Result", jqXHR, textStatus, errorThrown);
      $("#loading").removeClass("loading");
      $overlay.css({ display: "none" });
    });
  };

  const displayResult = (response) => {
    if (response.Itineraries.length === 0) {
      console.log("no flight");

      $("#result").append($("<div>").text("Sorry, we found no results matching your search").addClass("no-flight"));
    } else {
      response.Itineraries.forEach((itinerary) => {
        const minPrice = Math.round(itinerary.PricingOptions[0].Price);

        const outboundLeg = response.Legs.find((leg) => leg.Id === itinerary.OutboundLegId);
        const outboundInfo = outboundLeg.SegmentIds.map((segmentId) => {
          const segment = response.Segments.find((segment) => segment.Id === segmentId)
          const origin = response.Places.find((place) => place.Id === segment.OriginStation);
          const destination = response.Places.find((place) => place.Id === segment.DestinationStation);
          const carrier = response.Carriers.find((carrier) => carrier.Id === segment.Carrier);
          return ({
            id: segmentId,
            originId: origin.Id,
            originCode: origin.Code,
            originName: origin.Name,
            departureDateTime: segment.DepartureDateTime,
            destinationId: destination.Id,
            destinationCode: destination.Code,
            destinationName: destination.Name,
            arrivalDateTime: segment.ArrivalDateTime,
            carrier
          });
        });

        outboundInfo.sort((a, b) => a.departureDateTime < b.departureDateTime ? -1 : 1);

        const inboundLeg = response.Legs.find((leg) => leg.Id === itinerary.InboundLegId);
        const inboundInfo = inboundLeg.SegmentIds.map((segmentId) => {
          const segment = response.Segments.find((segment) => segment.Id === segmentId)
          const origin = response.Places.find((place) => place.Id === segment.OriginStation);
          const destination = response.Places.find((place) => place.Id === segment.DestinationStation);
          const carrier = response.Carriers.find((carrier) => carrier.Id === segment.Carrier);
          return ({
            id: segmentId,
            originId: origin.Id,
            originCode: origin.Code,
            originName: origin.Name,
            departureDateTime: segment.DepartureDateTime,
            destinationId: destination.Id,
            destinationCode: destination.Code,
            destinationName: destination.Name,
            arrivalDateTime: segment.ArrivalDateTime,
            carrier
          });
        });

        inboundInfo.sort((a, b) => a.departureDateTime < b.departureDateTime ? -1 : 1);

        $("#result").append($("<div>").addClass("itinerary"));
        $(".itinerary").last().append($("<div>").text(`${minPrice} ${response.Query.Currency}`).addClass("price"));

        $(".itinerary").last().append($("<div>").addClass("leg"));

        for (let i = 0; i < outboundInfo.length; i++) {
          $(".leg").last().append($("<div>").addClass("segment"));
          $(".segment").last().append($("<img>", { src: outboundInfo[i].carrier.ImageUrl }).addClass("carrier"));

          $(".segment").last().append($("<div>").addClass("time-and-place"));
          $(".time-and-place").last().append($("<div>").text(dateFormatter(outboundInfo[i].departureDateTime)));
          $(".time-and-place").last().append($("<div>").text(outboundInfo[i].originCode));
          $(".time-and-place").last().append($("<div>").text(outboundInfo[i].originName));

          $(".segment").last().append($("<i>").addClass("fas fa-angle-double-down direction"));

          $(".segment").last().append($("<div>").addClass("time-and-place"));
          $(".time-and-place").last().append($("<div>").text(dateFormatter(outboundInfo[i].arrivalDateTime)));
          $(".time-and-place").last().append($("<div>").text(outboundInfo[i].destinationCode));
          $(".time-and-place").last().append($("<div>").text(outboundInfo[i].destinationName));
        }

        $(".itinerary").last().append($("<div>").addClass("leg"));

        for (let i = 0; i < inboundInfo.length; i++) {
          $(".leg").last().append($("<div>").addClass("segment"));
          $(".segment").last().append($("<img>", { src: inboundInfo[i].carrier.ImageUrl }).addClass("carrier"));

          $(".segment").last().append($("<div>").addClass("time-and-place"));
          $(".time-and-place").last().append($("<div>").text(dateFormatter(inboundInfo[i].departureDateTime)));
          $(".time-and-place").last().append($("<div>").text(inboundInfo[i].originCode));
          $(".time-and-place").last().append($("<div>").text(inboundInfo[i].originName));

          $(".segment").last().append($("<i>").addClass("fas fa-angle-double-down direction"));

          $(".segment").last().append($("<div>").addClass("time-and-place"));
          $(".time-and-place").last().append($("<div>").text(dateFormatter(inboundInfo[i].arrivalDateTime)));
          $(".time-and-place").last().append($("<div>").text(inboundInfo[i].destinationCode));
          $(".time-and-place").last().append($("<div>").text(inboundInfo[i].destinationName));
        }
      });
    }
  };
});
