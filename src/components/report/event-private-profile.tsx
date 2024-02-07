/* eslint-disable react-hooks/rules-of-hooks */


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
import events from "../../pages/events";

const keys = { public: "public", private: "private", admin: "admin" };

type Props = {
  id: number;
};

const ReportPage: FC<Props> = ({ id }) => {
  const { en } = useContext(LanguageCtx);
  const { event, setEvent, loading } = usePrivateEventInfo(id);

  if (loading) return <CardSkeleton />;
  if (!event) return <Empty />;

  const events: EventPrivateInfo[] = [];
  events.push(event);

  const ExpandableMainEvent = ({ event }: { event: EventPrivateInfo }) => {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ marginLeft: "10px" }}>
            <CaretDownOutlined />
          </span>

          <span style={{ marginLeft: "10px" }}>
            <MinusOutlined />
          </span>
          <span>
            <strong> {en ? event.name_en : event.name_fr}, </strong>
            <EventType eventTypeId={event.event_type_id} />,
            {event.start_date
              ? new Date(event.start_date).toISOString().split("T")[0]
              : " "}
            , [<EventLength eventId={event.id} />
            ],
          </span>
        </div>
        <div style={{ marginLeft: "50px" }}>
          <ExpandableMember eventId={event.id} />
          <ExpandablePartner eventId={event.id} />
          <ExpandableGrant eventId={event.id} />
          <ExpandableProduct eventId={event.id} />
        </div>
        {/* Recursive rendering for child events */}
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
      </div>
    );
  };

  const ExpandableNextMainEvent = ({ eventId }: { eventId: number | null }) => {
    const [eventData, setEventData] = useState<EventPrivateInfo | null>(null);

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
        <span>
          <CaretDownOutlined />
        </span>
        <span>
          <MinusOutlined />
        </span>
        <strong>
          {en ? eventData.name_en : eventData.name_fr}, {""}
        </strong>
        <EventType eventTypeId={eventData.event_type_id} />,{" "}
        {eventData.start_date
          ? new Date(eventData.start_date).toISOString().split("T")[0]
          : " "}
        , [<EventLength eventId={eventData.id} />]
        <div style={{ marginLeft: "50px" }}>
          <ExpandableMember eventId={eventData.id} />
          <ExpandablePartner eventId={eventData.id} />
          <ExpandableGrant eventId={eventData.id} />
          <ExpandableProduct eventId={eventData.id} />
        </div>
        {/* Recursive rendering for nested events */}
        <div style={{ marginLeft: "70px" }}>
          {eventData.event_next_event_event_next_event_event_idToevent.map(
            (nextEvent) => (
              <div key={nextEvent.next_event_id}>
                <ExpandableNextMainEvent eventId={nextEvent.next_event_id} />
              </div>
            )
          )}
        </div>
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

  const ExpandableMember = ({ eventId }: { eventId: number }) => {
    const [eventMember, setEventMember] = useState<any[] | null>(null);

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

    return (
      <div style={{ cursor: "pointer" }}>
        <MinusOutlined />
        <strong>
          <strong>{en ? "Member Involved" : "Membre Impliqué"}</strong>
        </strong>
        [{eventMember.length}] :
        {eventMember.length > 0 ? (
          eventMember.map((entry: any, index: number) => (
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
              {index < eventMember.length - 1 ? ", " : ""}
            </React.Fragment>
          ))
        ) : (
          <span>{en ? "No Member Involved" : "Aucun Membre Impliqué."}</span>
        )}
      </div>
    );
  };

  const ExpandablePartner = ({ eventId }: { eventId: number }) => {
    // No state and event handlers for expansion
    const [eventPartner, setEventMember] = useState<any[] | null>(null);
    useEffect(() => {
      if (eventId !== null) {
        // Assuming you have a function or API call to fetch event data by event_id
        fetchEventId(eventId)
          .then((eventData) => {
            // Count the number of child events
            console.log(eventData);
            setEventMember(eventData.event_partner_involved);
            // Set eventPartner directly here without using state
            // setEventMember(eventData.event_partner_involved);
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    console.log(eventPartner); // You can remove this line
    if (!eventPartner) return null;
    // Render partner information without the expansion/collapsing logic
    return (
      <div>
        <MinusOutlined />
        <strong>{en ? "Event Partner" : "Partenaire de l'Événement"}</strong>[
        {eventPartner.length}] :
        {eventPartner.length > 0 ? (
          eventPartner.map((entry: any, index: number) => (
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
              {index < eventPartner.length - 1 ? ", " : ""}
            </React.Fragment>
          ))
        ) : (
          <span>
            {en ? "No Partner Involved" : "Aucun Partenaire Impliqué"}
          </span>
        )}
      </div>
    );
  };

  const ExpandableGrant = ({ eventId }: { eventId: number }) => {
    const [eventGrant, setEventGrant] = useState<any[] | null>(null);

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

    if (!eventGrant) return null;

    return (
      <div>
        <MinusOutlined />
        <strong>{en ? "Grant" : "Subvention"}</strong>[{eventGrant.length}] :
        {eventGrant.length > 0 ? (
          <span>
            {eventGrant.map((grant: any, index: number) => (
              <span key={index}>
                {"$"}
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
            ))}
          </span>
        ) : (
          <span>{en ? "No Grant Resulted" : "Aucune Subvention Résultée"}</span>
        )}
      </div>
    );
  };

  const ExpandableProduct = ({ eventId }: { eventId: number }) => {
    const [product, setProduct] = useState<any[] | null>(null);

    useEffect(() => {
      if (eventId !== null) {
        fetchEventId(eventId)
          .then((eventData) => {
            // Assuming you have a function to fetch product data
            setProduct(eventData.event_product_resulted);
          })
          .catch((error) => {
            console.error("Error fetching event data:", error);
          });
      }
    }, [eventId]);

    if (!product) return null;

    return (
      <div>
        <span>
          <MinusOutlined />
          <strong>{en ? "Product" : "Produit"}</strong>[{product.length}] :
          {product.length > 0 && (
            <span>
              {product.map((entry: any, index: number) => (
                <span key={index}>
                  <a
                    href={PageRoutes.productProfile(entry.product.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: "underline",
                      color: "blue",
                      marginRight: "5px",
                    }}
                  >
                    {en ? entry.product.title_en : entry.product.title_fr}
                  </a>
                  {index < product.length - 1 ? ", " : ""}
                </span>
              ))}
            </span>
          )}
          {product.length === 0 && (
            <span>{en ? "No Product Resulted" : "Aucun produit obtenu"}</span>
          )}
        </span>
      </div>
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

  return (
    <div>
      <div style={{ marginLeft: "25px" }}>
        <h1>Journey of Event</h1>
      </div>
      <div>
        <ExpandableMainEvent event={event} />
      </div>
    </div>
  );
};

export default ReportPage;
