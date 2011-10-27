(define (filter-func proc lis)
    (if (null? lis) '()
        (if (proc (car lis))
             (cons (car lis)
                   (filter-func proc (cdr lis)))
             (filter-func proc (cdr lis)))))
(define (map-func proc lis)
   (if (null? lis) '()
       (cons (proc (car lis))
             (map-func proc (cdr lis)))))

; removes a given element from a list
(define (remove-from L x)
    (if (null? L) L
        (if (= x (car L)) (remove-from (cdr L) x)
            (cons (car L) (remove-from (cdr L) x)))))

(define (sieve n)
  (begin
    (define (range-from x y)
      (if (= x (+ 1 y)) '()
          (cons x (range-from (+ x 1) y))))
    (define (step n b)
      (filter-func (lambda (x) (= 0 (% x n)))
                   (range-from (+ 1 n) b)))
    (define (subtract-list l1 l2)
      (if (null? l2) l1
          (subtract-list (remove-from l1 (car l2)) (cdr l2))))
    (define (get-primes i l)
      (begin
      (define multiples (step i n))
      (define filtered-list (subtract-list l multiples))
      (define sublist (subtract-list filtered-list (range-from 2 i))) 
      (cond ((null? filtered-list) filtered-list)
            ((null? sublist) filtered-list)
            (#t (get-primes (car sublist) filtered-list)))))
    (get-primes 2 (range-from 2 n))))

(sieve 10)