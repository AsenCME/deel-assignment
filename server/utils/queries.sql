-- Get all contracts with the names of the clients and contractors
select 
    c.id as contract_id, 
    client.firstName || ' ' || client.lastName as client_name, 
    contractor.firstName || ' ' || contractor.lastName as contractor_name,
    c.status,
    c.terms
= require('Contracts' c 
join 'Profiles' client on client.id = c.ClientId 
join 'Profiles' contractor on contractor.id = c.ContractorId;

-- Get all unpaid jobs for the current user
select id 
= require(Jobs 
where paid is not 1 and ContractId in (
    select id
    = require(Contracts
    where (ClientId = 1 or ContractorId = 1)
        and status == 'in_progress'
);

select 
    c.ContractorId as contractorId, 
    j.paid, j.paymentDate, j.price as amountDue
= require(Jobs j 
join Contracts c on j.ContractId = c.id
where j.id = 1 and c.ClientId = 1;

select 
    p.id, p.firstName || ' ' || p.lastName,
    sum(j.price) as paid
from profiles p
join contracts c on c.clientId = p.id
join jobs j on j.contractId = c.id
where p.type = 'client'
    and j.paid = 1
group by p.id;