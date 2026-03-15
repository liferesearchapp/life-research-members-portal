// Displays information about a public event

import Grid from "antd/lib/grid";
import Descriptions from "antd/lib/descriptions";
import Item from "antd/lib/descriptions/Item";
import { type FC, useContext } from "react";
import type { EventPublicInfo } from "../../services/_types";
import { LanguageCtx } from "../../services/context/language-ctx";
import React from "react";
import { Tag } from "antd";
import SafeLink from "../link/safe-link";
import PageRoutes from "../../routing/page-routes";

const { useBreakpoint } = Grid;

type Props = {
  event: EventPublicInfo;
};

const PublicEventDescription: FC<Props> = ({ event }) => {
  const screens = useBreakpoint();
  const { en } = useContext(LanguageCtx);

  return (
    <Descriptions
      size="small"
      bordered
      column={1}
      className="event-description"
      labelStyle={{ whiteSpace: "nowrap", width: 0 }}
      layout={screens.xs ? "vertical" : "horizontal"}
    >
      <Item label={en ? "Name (English)" : "Nom (anglais)"}>
        {event.name_en}
      </Item>
      <Item label={en ? "Name (French)" : "Nom (français)"}>
        {event.name_fr}
      </Item>
      <Item label={en ? "Start Date" : "Date de début"}>
        {event.start_date
          ? new Date(event.start_date).toISOString().split("T")[0]
          : ""}
      </Item>
      <Item label={en ? "End Date" : "Date de fin"}>
        {event.end_date
          ? new Date(event.end_date).toISOString().split("T")[0]
          : ""}
      </Item>
      <Item label={en ? "Event Type" : "Type d'événement"}>
        {event.event_type
          ? en
            ? event.event_type.name_en
            : event.event_type.name_fr
          : ""}
      </Item>

      <Item label={en ? "Members Involved" : "Membres impliqués"}>
        {event.event_member_involved.map((entry, i) => (
          <SafeLink
            key={entry.member.id}
            href={PageRoutes.memberProfile(entry.member.id)}
          >
            <Tag color="blue">
              {entry.member.account.first_name +
                " " +
                entry.member.account.last_name}
            </Tag>
          </SafeLink>
        ))}
      </Item>

      <Item label={en ? "Event Partnership" : "Partenariat de l'événement"}>
        {event.event_partner_involved.map((entry, i) => (
          <SafeLink
            key={entry.organization.id}
            href={PageRoutes.organizationProfile(entry.organization.id)}
          >
            <Tag color="green">
              {en ? entry.organization.name_en : entry.organization.name_fr}
            </Tag>
          </SafeLink>
        ))}
      </Item>

      <Item label={en ? "Previous Events" : "Événements précédents"}>
        <ol>
          {event.event_previous_event_event_previous_event_event_idToevent &&
            event.event_previous_event_event_previous_event_event_idToevent.map(
              (prevEvent) => (
                <li key={prevEvent.previous_event_id}>
                  <SafeLink
                    href={PageRoutes.eventProfile(prevEvent.previous_event_id)}
                  >
                    {en
                      ? prevEvent
                          .event_event_previous_event_previous_event_idToevent
                          .name_en
                      : prevEvent
                          .event_event_previous_event_previous_event_idToevent
                          .name_fr}
                  </SafeLink>
                </li>
              )
            )}
        </ol>
      </Item>
      <Item label={en ? "Next Events" : "Événements suivants"}>
        <ol>
          {event.event_next_event_event_next_event_event_idToevent &&
            event.event_next_event_event_next_event_event_idToevent.map(
              (nextEvent) => (
                <li key={nextEvent.next_event_id}>
                  <SafeLink
                    href={PageRoutes.eventProfile(nextEvent.next_event_id)}
                  >
                    {en
                      ? nextEvent.event_event_next_event_next_event_idToevent
                          .name_en
                      : nextEvent.event_event_next_event_next_event_idToevent
                          .name_fr}
                  </SafeLink>
                </li>
              )
            )}
        </ol>
      </Item>

      <Item label={en ? "Grants Resulted" : "Subventions résultantes"}>
        <ol>
          {event.event_grant_resulted.map((entry, i) =>
            entry.grant ? (
              <li key={entry.grant.id}>
                <SafeLink href={PageRoutes.grantProfile(entry.grant.id)}>
                  {entry.grant.title}
                </SafeLink>
              </li>
            ) : null
          )}
        </ol>
      </Item>

      <Item label={en ? "Product Resulted" : "Produits résultants"}>
        <ol>
          {event.event_product_resulted.map((entry, i) =>
            entry.product ? (
              <li key={entry.product.id}>
                <SafeLink href={PageRoutes.productProfile(entry.product.id)}>
                  {en ? entry.product.title_en : entry.product.title_fr}
                </SafeLink>
              </li>
            ) : null
          )}
        </ol>
      </Item>

      <Item label={en ? "Institute" : "L'institut"}>
        <Tag
          key={event.institute.id}
        >{`${event.institute.name} - ${event.institute.urlIdentifier}`}</Tag>
      </Item>

      <Item label={en ? "Event Topic" : "Sujet de l'événement"}>
        {event.event_topic.map((entry, i) => (
          <Tag key={i} color="blue">
            {en ? entry.topic.name_fr : entry.topic.name_en}
          </Tag>
        ))}
      </Item>

      <Item label={en ? "Note" : "Note"} style={{ whiteSpace: "break-spaces" }}>
        {event.note}
      </Item>
    </Descriptions>
  );
};

export default PublicEventDescription;
