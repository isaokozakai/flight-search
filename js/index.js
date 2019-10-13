$(() => {
  $("#departureDate").datepicker();
  $("#arrivalDate").datepicker();

  $("#from, #to").autocomplete({
    source: (req, res) => {
      $.ajax({
        "async": true,
        "crossDomain": true,
        "data": `text=${req.term}`,
        "url": 'https://cometari-airportsfinder-v1.p.rapidapi.com/api/airports/by-text',
        "method": "GET",
        "headers": {
          "x-rapidapi-host": "cometari-airportsfinder-v1.p.rapidapi.com",
          "x-rapidapi-key": "9e17e55ef7msh7b448d0f0cae1b2p13d1cfjsn95340acc8e72"
        }
      }).done((data) => res(
        data.map(
          (airport) => ({
            label: `${airport.name} (${airport.code})`,
            value: `${airport.name} (${airport.code})`,
            code: `${airport.code}-sky`
          })
        )
      ));
    },
    select: function (e, ui) {
      $(this).attr('code', ui.item.code);
    }
  });

  $(".minus").click(function (e) {
    const $inputElement = $(this).next();
    const value = parseInt($inputElement.val());
    if (value == 0) return;
    $inputElement.val(value - 1);
  });

  $(".plus").click(function (e) {
    const $inputElement = $(this).prev();
    const value = parseInt($inputElement.val());
    if (value == 8) return;
    $inputElement.val(value + 1);
  });

  $("#inputForm").submit((e) => {
    e.preventDefault();
    $("#result").empty();
    let [originPlace, destinationPlace, outboundDate, inboundDate, cabinClass, adults, children, infants] = e.target.elements;
    originPlace = $(originPlace)[0].attributes.code.value;
    destinationPlace = $(destinationPlace)[0].attributes.code.value;
    outboundDate = $.datepicker.formatDate("yy-mm-dd", new Date(outboundDate.value));
    inboundDate = $.datepicker.formatDate("yy-mm-dd", new Date(inboundDate.value));
    cabinClass = cabinClass.value;
    adults = adults.value.toString();
    children = children.value.toString();
    infants = infants.value.toString();

    const setting = {
      "async": true,
      "crossDomain": true,
      "url": "https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/v1.0",
      "method": "POST",
      "headers": {
        "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
        "x-rapidapi-key": "9e17e55ef7msh7b448d0f0cae1b2p13d1cfjsn95340acc8e72",
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
        "country": "US",
        "currency": "USD",
        "locale": "en-US"
      }
    };

    $.ajax(setting).done((response) => {
      console.log(response);

    }).fail((jqXHR, textStatus, errorThrown) => {
      console.log(jqXHR, textStatus, errorThrown);

    }).always((data, textStatus, jqXHR) => {
      console.log(data, textStatus, jqXHR);

      const sessionkey = jqXHR.getResponseHeader("location").slice(-36);
      const setting = {
        "async": true,
        "crossDomain": true,
        "url": `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/pricing/uk2/v1.0/${sessionkey}`,
        "method": "GET",
        "headers": {
          "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
          "x-rapidapi-key": "9e17e55ef7msh7b448d0f0cae1b2p13d1cfjsn95340acc8e72"
        },
        "data": {
          "sortType": "price",
          "sortOrder": "asc",
          "stops": "1"
        }
      };

      $.ajax(setting).done((response) => {
        console.log(response);
        if (response.Itineraries.length === 0) {
          console.log("no flight")
        } else {
          response.Itineraries.forEach((itinerary) => {
            const minPrice = itinerary.PricingOptions[0].Price;

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

            $("#result").append($("<div></div>").addClass("itinerary"));
            $(".itinerary").last().append($("<div></div>").text(`${minPrice} ${response.Query.Currency}`).addClass("price"));

            $(".itinerary").last().append($("<div></div>").addClass("leg"));
            $(".leg").last().append($("<div></div>").addClass("leg-content"));

            for (let i = 0; i < outboundInfo.length; i++) {
              $(".leg-content").last().append($("<div></div>").addClass("segment"));

              $(".segment").last().append($("<img></img>").attr("src", outboundInfo[i].carrier.ImageUrl).addClass("carrier"));

              $(".segment").last().append($("<div></div>").addClass("time-and-place"));
              $(".time-and-place").last().append($("<div></div>").text(dateFormatter(outboundInfo[i].departureDateTime)));
              $(".time-and-place").last().append($("<div></div>").text(outboundInfo[i].originCode));
              $(".time-and-place").last().append($("<div></div>").text(outboundInfo[i].originName));

              $(".segment").last().append($("<i></i>").addClass("fas fa-angle-double-right rightward"));

              $(".segment").last().append($("<div></div>").addClass("time-and-place"));
              $(".time-and-place").last().append($("<div></div>").text(dateFormatter(outboundInfo[i].arrivalDateTime)));
              $(".time-and-place").last().append($("<div></div>").text(outboundInfo[i].destinationCode));
              $(".time-and-place").last().append($("<div></div>").text(outboundInfo[i].destinationName));
            }

            $(".itinerary").last().append($("<div></div>").addClass("leg"));
            $(".leg").last().append($("<div></div>").addClass("leg-content"));

            for (let i = 0; i < inboundInfo.length; i++) {
              $(".leg-content").last().append($("<div></div>").addClass("segment"));

              $(".segment").last().append($("<img></img>").attr("src", inboundInfo[i].carrier.ImageUrl).addClass("carrier"));

              $(".segment").last().append($("<div></div>").addClass("time-and-place"));
              $(".time-and-place").last().append($("<div></div>").text(dateFormatter(inboundInfo[i].departureDateTime)));
              $(".time-and-place").last().append($("<div></div>").text(inboundInfo[i].originCode));
              $(".time-and-place").last().append($("<div></div>").text(inboundInfo[i].originName));

              $(".segment").last().append($("<i></i>").addClass("fas fa-angle-double-right rightward"));

              $(".segment").last().append($("<div></div>").addClass("time-and-place"));
              $(".time-and-place").last().append($("<div></div>").text(dateFormatter(inboundInfo[i].arrivalDateTime)));
              $(".time-and-place").last().append($("<div></div>").text(inboundInfo[i].destinationCode));
              $(".time-and-place").last().append($("<div></div>").text(inboundInfo[i].destinationName));
            }
          });
        }
      });
    });
  });

  const dateFormatter = (value) => {
    const date = new Date(value);
    const options = { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleString('en-US', options);
  
  }
});