//with Last version 5

import Empty from "antd/lib/empty";
import { FC, useContext, useEffect, useState } from "react";
import CardSkeleton from "../loading/card-skeleton";
import usePrivateEventInfo from "../../services/use-private-event-info";
import { LanguageCtx, en } from "../../services/context/language-ctx";
import type {
  EventPrivateInfo,
  ProductPublicInfo,
} from "../../services/_types";

import SafeLink from "../link/safe-link";
import PageRoutes from "../../routing/page-routes";

import {
  CaretDownOutlined,
  CaretRightOutlined,
  MinusOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import React from "react";
import Button from "antd/lib/button";

const keys = { public: "public", private: "private", admin: "admin" };

type Props = {
  id: number;
};

const PrivateJoeProfile: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { event, setEvent, loading } = usePrivateEventInfo(id);
  const [reportGenerated, setReportGenerated] = useState(false);
  const reportButton = () => {
    window.open(PageRoutes.report(id));
  };

  if (loading) return <CardSkeleton />;
  if (!event) return <Empty />;

  const events: EventPrivateInfo[] = [];
  events.push(event);

  const ExpandableMainEvent = ({ event }: { event: EventPrivateInfo }) => {
    const [expandedEventDetails, setExpandedDetail] = useState(false);
    const [expandedEvent, setExpandedEvent] = useState(false);

    const handleEventDetailsToggle = () => {
      setExpandedDetail(!expandedEventDetails);
    };

    const handleEventToggle = () => {
      setExpandedEvent(!expandedEvent);
    };

    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
          }}
        >
          <span
            style={{ marginLeft: "10px", cursor: "pointer" }}
            onClick={handleEventToggle}
          >
            {expandedEvent ? <CaretDownOutlined /> : <CaretRightOutlined />}
          </span>

          <span
            style={{ marginLeft: "10px", cursor: "pointer" }}
            onClick={handleEventDetailsToggle}
          >
            {expandedEventDetails ? <MinusOutlined /> : <PlusOutlined />}
          </span>
          <span>
            <strong> {en ? event.name_en : event.name_fr}, </strong>
            <EventType eventTypeId={event.event_type_id} />,
            {event.start_date
              ? new Date(event.start_date).toISOString().split("T")[0]
              : " "}
            , [<EventLength eventId={event.id} />]
          </span>
        </div>
        {expandedEventDetails && (
          <div style={{ marginLeft: "50px" }}>
            {event.event_member_involved &&
              event.event_member_involved.length > 0 && (
                <ExpandableMember eventId={event.id} />
              )}
            {event.event_partner_involved &&
              event.event_partner_involved.length > 0 && (
                <ExpandablePartner eventId={event.id} />
              )}
            {event.event_grant_resulted &&
              event.event_grant_resulted.length > 0 && (
                <ExpandableGrant eventId={event.id} />
              )}
            {event.event_product_resulted &&
              event.event_product_resulted.length > 0 && (
                <ExpandableProduct eventId={event.id} />
              )}
          </div>
        )}
        {/* Recursive rendering for child events */}
        {expandedEvent && (
          <div style={{ marginLeft: "25px" }}>
            <div>
              {event.event_next_event_event_next_event_event_idToevent &&
                event.event_next_event_event_next_event_event_idToevent.map(
                  (nextEvent) => (
                    <div key={nextEvent.next_event_id}>
                      <ExpandableNextMainEvent
                        eventId={nextEvent.next_event_id}
                      />
                    </div>
                  )
                )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ExpandableNextMainEvent = ({ eventId }: { eventId: number | null }) => {
    const [expandedNextEvents, setExpandedNextEvents] = useState(false);
    const [expandedNextEventDetails, setExpandedNextEventDetail] =
      useState(false);
    const [eventData, setEventData] = useState<EventPrivateInfo | null>(null);

    const handleNextEventToggle = () => {
      setExpandedNextEvents(!expandedNextEvents);
    };

    const handleNextEventDetailToggle = () => {
      setExpandedNextEventDetail(!expandedNextEventDetails);
    };

    useEffect(() => {
      if (eventId !== null) {
        fetchEventId(eventId)
          .then((eventData) => {
            setEventData(eventData);
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    if (!eventData) return null;

    return (
      <div>
        <span onClick={handleNextEventToggle}>
          {expandedNextEvents ? <CaretDownOutlined /> : <CaretRightOutlined />}
        </span>
        <span onClick={handleNextEventDetailToggle}>
          {expandedNextEventDetails ? <MinusOutlined /> : <PlusOutlined />}
        </span>
        <strong>
          {en ? eventData.name_en : eventData.name_fr}, {""}
        </strong>
        <EventType eventTypeId={eventData.event_type_id} />,{" "}
        {eventData.start_date
          ? new Date(eventData.start_date).toISOString().split("T")[0]
          : " "}
        , [<EventLength eventId={eventData.id} />]
        {expandedNextEventDetails && (
          <div style={{ marginLeft: "50px" }}>
            {eventData.event_member_involved &&
              eventData.event_member_involved.length > 0 && (
                <ExpandableMember eventId={eventData.id} />
              )}
            {eventData.event_partner_involved &&
              eventData.event_partner_involved.length > 0 && (
                <ExpandablePartner eventId={eventData.id} />
              )}
            {eventData.event_grant_resulted &&
              eventData.event_grant_resulted.length > 0 && (
                <ExpandableGrant eventId={eventData.id} />
              )}
            {eventData.event_product_resulted &&
              eventData.event_product_resulted.length > 0 && (
                <ExpandableProduct eventId={eventData.id} />
              )}
          </div>
        )}
        {/* Recursive rendering for nested events */}
        {expandedNextEvents &&
          eventData.event_next_event_event_next_event_event_idToevent.map(
            (nextEvent) => (
              <div key={nextEvent.next_event_id} style={{ marginLeft: "70px" }}>
                <ExpandableNextMainEvent eventId={nextEvent.next_event_id} />
              </div>
            )
          )}
      </div>
    );
  };
  const EventType = ({ eventTypeId }: { eventTypeId: number | null }) => {
    const [eventType, setEventType] = useState<string | null>(null);

    useEffect(() => {
      if (eventTypeId !== null) {
        // Assuming you have a function or API call to fetch event type by event_type_id
        fetchEventTypeById(eventTypeId)
          .then((eventTypeData) => {
            setEventType(eventTypeData); // Set the event type fetched from the API response
          })
          .catch((error) => {
            console.error("Error fetching event type:", error);
          });
      }
    }, [eventTypeId]);

    return <>{eventType}</>; // Display the event type or "Loading..." if not fetched yet
  };

  // Member components---------------------------------------------------
  const ExpandableMember = ({ eventId }: { eventId: number }) => {
    const [eventMember, setEventMember] = useState<any[] | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
      setExpanded(!expanded);
    };

    useEffect(() => {
      if (eventId !== null) {
        // Assuming you have a function or API call to fetch event data by event_id
        fetchEventId(eventId)
          .then((eventData) => {
            // Count the number of child events
            console.log(eventData);
            setEventMember(eventData.event_member_involved);
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    console.log(eventMember);

    if (!eventMember) return null;

    const displayedMembers = expanded ? eventMember : eventMember.slice(0, 2);

    return (
      <div onClick={handleToggle} style={{ cursor: "pointer" }}>
        {expanded ? <MinusOutlined /> : <PlusOutlined />}
        <strong>{en ? "Member Involved" : "Membre Impliqué"}</strong> [
        {eventMember.length}]:
        {eventMember.length > 0 ? (
          displayedMembers.map((entry: any, index: number) => (
            <React.Fragment key={index}>
              <a
                href={PageRoutes.memberProfile(entry.member.id)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "underline",
                  color: "blue",
                  marginRight: "5px",
                }}
              >
                {entry.member.account.first_name +
                  " " +
                  entry.member.account.last_name}
              </a>
              {index < displayedMembers.length - 1 ? ", " : ""}
            </React.Fragment>
          ))
        ) : (
          <span>{en ? "No Member Involved" : "Aucun Membre Impliqué."}</span>
        )}
        {eventMember.length > 2 && (
          <span
            style={{ marginLeft: "4px", color: "orange", cursor: "pointer" }}
          >
            {expanded ? "" : "View more..."}
          </span>
        )}
      </div>
    );
  };

  //Partner Components-----------------------------------------------------
  const ExpandablePartner = ({ eventId }: { eventId: number }) => {
    const [eventPartner, setEventMember] = useState<any[] | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
      setExpanded(!expanded);
    };

    useEffect(() => {
      if (eventId !== null) {
        // Assuming you have a function or API call to fetch event data by event_id
        fetchEventId(eventId)
          .then((eventData) => {
            // Count the number of child events
            console.log(eventData);
            setEventMember(eventData.event_partner_involved);
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    console.log(eventPartner);

    if (!eventPartner) return null;

    const displayedEventPartner = expanded
      ? eventPartner
      : eventPartner.slice(0, 2);

    return (
      <div onClick={handleToggle} style={{ cursor: "pointer" }}>
        {expanded ? <MinusOutlined /> : <PlusOutlined />}
        <strong>{en ? "Event Partner" : "Partenaire de l'Événement"}</strong> [
        {eventPartner.length}]:
        {eventPartner.length > 0 ? (
          displayedEventPartner.map((entry: any, index: number) => (
            <React.Fragment key={index}>
              <a
                href={PageRoutes.organizationProfile(entry.organization.id)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  textDecoration: "underline",
                  color: "blue",
                  marginRight: "5px",
                }}
              >
                {en ? entry.organization.name_en : entry.organization.name_fr}
              </a>
              {index < displayedEventPartner.length - 1 ? ", " : ""}
            </React.Fragment>
          ))
        ) : (
          <span>
            {en ? "No Partner Involved" : "Aucun partenaire impliqué."}
          </span>
        )}
        {eventPartner.length > 2 && (
          <span
            style={{ marginLeft: "4px", color: "orange", cursor: "pointer" }}
          >
            {expanded ? "" : "View more..."}
          </span>
        )}
      </div>
    );
  };

  //Event Grant
  const ExpandableGrant = ({ eventId }: { eventId: number }) => {
    const [eventGrant, setEventGrant] = useState<any[] | null>(null);
    const [eventStatus, setEventStatus] = useState<any[] | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
      setExpanded(!expanded);
    };

    useEffect(() => {
      if (eventId !== null) {
        fetchEventId(eventId)
          .then((eventData) => {
            setEventGrant(eventData.event_grant_resulted);
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    useEffect(() => {
      if (eventGrant && eventGrant.length > 0) {
        // const grantId = eventGrant((grant: any) => grant.id);
        console.log(eventGrant[0].grant.status_id);
        // Assuming fetchGrantStatus function takes an array of grantIds
        fetchGrantStatus(eventGrant[0].grant.status_id)
          .then((eventDataStatus) => {
            setEventStatus(eventDataStatus);
          })
          .catch((error) => {
            console.error("Error fetching grant status:", error);
          });
      }
    }, [eventGrant]);

    if (!eventGrant) return null;

    return (
      <div>
        <span onClick={handleToggle} style={{ cursor: "pointer" }}>
          {expanded ? <MinusOutlined /> : <PlusOutlined />}
          <strong>{en ? "Grant" : "Subvention"}</strong> [{eventGrant.length}]:
          {eventGrant.length > 0 ? (
            <span>
              {eventGrant.map((grant: any, index: number) => (
                <span key={index}>
                  {index === 0 && (
                    <span>
                      {eventStatus}, {"$"}
                      {grant.grant.amount},{" "}
                      <a
                        href={PageRoutes.grantProfile(grant.grant.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "underline", color: "blue" }}
                      >
                        {grant.grant.title}
                      </a>{" "}
                    </span>
                  )}
                  {index === 1 && (
                    <span>
                      {expanded ? (
                        <span>
                          {"$"}
                          {grant.grant.amount},{" "}
                          <a
                            href={PageRoutes.grantProfile(grant.grant.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              textDecoration: "underline",
                              color: "blue",
                            }}
                          >
                            {grant.grant.title}
                          </a>{" "}
                        </span>
                      ) : (
                        <span
                          style={{
                            marginLeft: "4px",
                            color: "orange",
                            cursor: "pointer",
                          }}
                          onClick={handleToggle}
                        >
                          View more...
                        </span>
                      )}
                    </span>
                  )}
                  {index > 1 && null}
                </span>
              ))}
            </span>
          ) : (
            <span>
              {en ? "No Grant Resulted" : "Aucune Subvention Résultée."}
            </span>
          )}
        </span>
      </div>
    );
  };

  const ExpandableProduct = ({ eventId }: { eventId: number }) => {
    const [products, setProducts] = useState<any[] | null>(null);
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
      setExpanded(!expanded);
    };

    useEffect(() => {
      if (eventId !== null) {
        fetchEventId(eventId)
          .then((eventData) => {
            setProducts(eventData.event_product_resulted);
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    useEffect(() => {
      if (products && products.length > 0) {
        const productTypePromises = products.map((product) => {
          return fetchProductType(product.product.product_type_id);
        });

        Promise.all(productTypePromises)
          .then((productTypes) => {
            const updatedProducts = products.map((product, index) => {
              return {
                ...product,
                productType: productTypes[index], // Assuming this is how you store product type data
              };
            });
            setProducts(updatedProducts);
          })
          .catch((error) => {
            console.error("Error fetching product types:", error);
          });
      }
    }, [products]);

    if (!products) return null;

    // Display the first product by default
    const initialProducts = expanded ? products : [products[0]];

    return (
      <span>
        <span onClick={handleToggle} style={{ cursor: "pointer" }}>
          {expanded ? <MinusOutlined /> : <PlusOutlined />}
          <strong>{en ? "Product" : "Produit"}</strong> [{products.length}]:
        </span>
        {initialProducts.map((product: any, index: number) => (
          <span key={index}>
            {index === 0 ? ( // Display inline for the first product
              <span>
                {product.productType},{" "}
                <a
                  href={PageRoutes.productProfile(product.product.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "underline",
                    color: "blue",
                    marginRight: "5px",
                  }}
                >
                  {en ? product.product.title_en : product.product.title_fr}
                </a>
                {/* Render other product details as needed */}
              </span>
            ) : (
              // Display as a list for other products
              <li style={{ marginLeft: "80px" }}>
                {product.productType},{" "}
                <a
                  href={PageRoutes.productProfile(product.product.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: "underline",
                    color: "blue",
                    marginRight: "5px",
                  }}
                >
                  {en ? product.product.title_en : product.product.title_fr}
                </a>
                {/* Render other product details as needed */}
              </li>
            )}
          </span>
        ))}
        {products.length > 1 && (
          <span
            style={{ color: "orange", cursor: "pointer" }}
            onClick={handleToggle}
          >
            {expanded ? "" : "View More..."}
          </span>
        )}
        {products.length === 0 && (
          <span>{en ? "No Product Resulted" : "Aucun produit obtenu"}</span>
        )}
      </span>
    );
  };

  async function fetchEventTypeById(eventTypeId: number) {
    try {
      const response = await fetch("/api/all-event-types"); // Adjust the API endpoint
      if (!response.ok) {
        throw new Error("Failed to fetch event type data");
      }

      const eventTypeData = await response.json();
      const eventType = eventTypeData.find(
        (event: any) => event.id === eventTypeId
      );

      if (!eventType) {
        throw new Error("Event type not found for the provided eventTypeId");
      }

      return en ? eventType.name_en : eventType.name_fr;
    } catch (error) {
      console.error("Error fetching event type:", error);
      throw error;
    }
  }

  //Each event Length component
  const EventLength = ({ eventId }: { eventId: number }) => {
    const [eventLength, setEventLength] = useState<number | null>(null);

    useEffect(() => {
      if (eventId !== null) {
        // Assuming you have a function or API call to fetch event data by event_id
        fetchEventId(eventId)
          .then((eventData) => {
            // Count the number of child events
            console.log(eventData);
            setEventLength(
              eventData.event_next_event_event_next_event_event_idToevent.length
            );
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    return <>{eventLength !== null ? eventLength : "0"}</>;
  };

  async function fetchEventId(eventId: number) {
    try {
      const response = await fetch(`/api/all-events/`); // Adjust the API endpoint
      if (!response.ok) {
        throw new Error("Failed to fetch event data");
      }
      const eventData = await response.json();
      const eventFound = eventData.find((event: any) => event.id === eventId);
      // console.log(eventFound);
      return eventFound;
    } catch (error) {
      console.error("Error fetching event data:", error);
      throw error;
    }
  }

  async function fetchGrantStatus(eventId: number) {
    try {
      const response = await fetch("/api/all-statuses"); // Adjust the API endpoint
      if (!response.ok) {
        throw new Error("Failed to fetch event type data");
      }

      const eventTypeData = await response.json();
      const eventStatus = eventTypeData.find(
        (event: any) => event.id === eventId
      );

      if (!eventStatus) {
        throw new Error("Event type not found for the provided eventTypeId");
      }

      return en ? eventStatus.name_en : eventStatus.name_fr;
    } catch (error) {
      console.error("Error fetching event type:", error);
      throw error;
    }
  }

  async function fetchProductType(productTypeId: number) {
    try {
      const response = await fetch("/api/all-product-types"); // Adjust the API endpoint
      if (!response.ok) {
        throw new Error("Failed to fetch event type data");
      }

      const productType = await response.json();
      const productStatus = productType.find(
        (event: any) => event.id === productTypeId
      );

      if (!productStatus) {
        throw new Error("Event type not found for the provided eventTypeId");
      }

      return en ? productStatus.name_en : productStatus.name_fr;
    } catch (error) {
      console.error("Error fetching event type:", error);
      throw error;
    }
  }

  return (
    <div>
      <div style={{ marginLeft: "25px" }}>
        <h1>Journey of Event</h1>
        <div>
          {/* 
          <Button size="large" type="primary" onClick={reportButton}> ### Currently I disable this reporting option for future work.
            {en ? "Generate Report" : "Generate Report"}
          </Button> */}
        </div>
      </div>
      <ExpandableMainEvent key={event.id} event={event} />
    </div>
  );
};

export default PrivateJoeProfile;
