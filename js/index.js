$(() => {
  $("#departureDate").datepicker();
  $("#returnDate").datepicker();

  $("#from, #to").autocomplete({
    maxShowItems: 5,
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

  $("#inputForm").submit((e) => {
    e.preventDefault();
    $("#result").empty();
    const [from, to, departureDate, returnDate] = e.target.elements;
    const originplace = $(from)[0].attributes.code.value;
    const destinationplace = $(to)[0].attributes.code.value;
    const outbounddate = $.datepicker.formatDate( "yy-mm-dd", new Date(departureDate.value));
    const inbounddate = $.datepicker.formatDate( "yy-mm-dd", new Date(returnDate.value));
    $.ajax({
      "async": true,
      "crossDomain": true,
      "url": `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/v1.0/US/USD/en-US/${originplace}/${destinationplace}/${outbounddate}?inboundpartialdate=${inbounddate}`,
      "method": "GET",
      "headers": {
        "x-rapidapi-host": "skyscanner-skyscanner-flight-search-v1.p.rapidapi.com",
        "x-rapidapi-key": "9e17e55ef7msh7b448d0f0cae1b2p13d1cfjsn95340acc8e72"
      }
    }).done((response) => {
      if (response.Quotes.length === 0) {
        console.log("no flight")
      } else {
        const directFlights = response.Quotes.filter((quote) => quote.Direct);
        if (directFlights.length === 0) {
          console.log("no direct")
        } else {
          const carrierNames = response.Carriers.map((carrier) => ({ [carrier.CarrierId]: carrier.Name }));

          directFlights.forEach((flight) => {
            const carrierId = flight.OutboundLeg.CarrierIds[0];
            const carrier = response.Carriers.find((carrier) => carrier.CarrierId === carrierId)
            $("#result").append(`
            <div>
              ${flight.MinPrice}, ${carrier.Name}
            </div>
            `)
          });
        }
      }
    });
  }
  );
});
